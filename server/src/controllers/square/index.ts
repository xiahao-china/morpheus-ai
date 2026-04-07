import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";
import GenerationTask from "@/models/generationTask";
import User from "@/models/user";
import FileResource from "@/models/fileResource";
import UserSquareCollect from "@/models/userSquareCollect";
import { BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";
import { sendResponse } from "@/utils/const";
import { buildSquareFilter, Context, getNextLikeCount } from "./const";

/**
 * 获取广场列表（支持风格和场景标签筛选）
 */
export const getSquareList = async (ctx: Context) => {
  const { page = 1, pageSize = 20, styleTags, sceneTags } = ctx.query;
  const filter = buildSquareFilter(styleTags, sceneTags);

  const rawList = await Square.find(filter)
    .sort({ publishedTime: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))
    .lean();
  const total = await Square.countDocuments(filter);
  const userIds = Array.from(new Set(rawList.map((item) => String(item.userId || "")).filter(Boolean)));
  const imageIds = rawList.map((item) => String(item.imageId || "")).filter(Boolean);

  const currentUserId = ctx.state.user?._id;
  const squareIds = rawList.map((item) => String(item._id));
  const [userList, imageList, userCollections] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }, { _id: 1, nickname: 1, username: 1, avatar: 1 }).lean() : [],
    imageIds.length ? ImageGenInfo.find({ _id: { $in: imageIds } }, { _id: 1, fileResourceId: 1, imageUrl: 1 }).lean() : [],
    currentUserId ? UserSquareCollect.find({ userId: currentUserId, squareId: { $in: squareIds } }).lean() : [],
  ]);

  const userCollectionSet = new Set(userCollections.map((item) => String(item.squareId)));

  const userMap = userList.reduce((map, user) => {
    map[String(user._id)] = user;
    return map;
  }, {} as Record<string, { _id: any; nickname?: string; username?: string; avatar?: string }>);

  const imageMap = imageList.reduce((map, image) => {
    map[String(image._id)] = image;
    return map;
  }, {} as Record<string, { _id: any; fileResourceId?: string; imageUrl?: string }>);

  const avatarIds = Array.from(new Set(userList.map((user) => user.avatar).filter((avatar) => avatar && /^[0-9a-fA-F]{24}$/.test(avatar))));
  const fileResources = avatarIds.length ? await FileResource.find({ _id: { $in: avatarIds } }).lean() : [];
  const fileResourceMap = fileResources.reduce((map, file) => {
    map[String(file._id)] = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
    return map;
  }, {} as Record<string, string>);

  const list = rawList.map((item) => {
    const user = userMap[String(item.userId || "")];
    const image = imageMap[String(item.imageId || "")];
    const imageUrl = image?.fileResourceId
      ? buildObjectPublicUrl(BUCKET_NAME, image.fileResourceId)
      : (image?.imageUrl || item.imageUrl || "");
    let avatar = user?.avatar || "";
    if (avatar && fileResourceMap[avatar]) {
      avatar = fileResourceMap[avatar];
    }
    const { _id, userId: authorId, imageId: imgId, ...rest } = item;
    return {
      ...rest,
      id: String(_id),
      imageUrl,
      username: user?.nickname || user?.username || "匿名用户",
      avatar,
      isCollected: userCollectionSet.has(String(_id)),
      isOwner: currentUserId === String(authorId),
    };
  });
  sendResponse.success(ctx, { list, total });
};

/**
 * 获取广场详情
 */
export const getSquareDetail = async (ctx: Context) => {
  try {
    const { id } = ctx.params;
    if (!id) {
      ctx.body = { code: 400, msg: "id is required" };
      return;
    }

    const square = await Square.findById(id).lean();
    if (!square) {
      ctx.body = { code: 404, msg: "Not found" };
      return;
    }

    const userId = ctx.state.user?._id;
    const [userInfo, imageInfo, isCollected] = await Promise.all([
      square.userId ? User.findById(square.userId).lean() : null,
      square.imageId ? ImageGenInfo.findById(square.imageId).lean() : null,
      userId ? UserSquareCollect.exists({ userId, squareId: id }) : Promise.resolve(false),
    ]);

    const imageGenTaskId = imageInfo?.imageGenTaskId;
    const generationTask = imageGenTaskId
      ? await GenerationTask.findById(imageGenTaskId).lean()
      : null;
    const currentImageUrl = imageInfo?.fileResourceId
      ? buildObjectPublicUrl(BUCKET_NAME, imageInfo.fileResourceId)
      : (imageInfo?.imageUrl || square.imageUrl || "");

    let underImageUrl = generationTask?.params?.underImage?.url || generationTask?.params?.underImage?.id || generationTask?.params?.baseImages?.[0] || "";
    if (underImageUrl && /^[0-9a-fA-F]{24}$/.test(underImageUrl)) {
      const file = await FileResource.findById(underImageUrl).lean();
      if (file) underImageUrl = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
    }

    let referImageUrl = generationTask?.params?.referImage?.url || generationTask?.params?.referImage?.id || "";
    if (referImageUrl && /^[0-9a-fA-F]{24}$/.test(referImageUrl)) {
      const file = await FileResource.findById(referImageUrl).lean();
      if (file) referImageUrl = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
    }

    const taskDetail = generationTask ? {
      taskId: generationTask._id?.toString(),
      status: generationTask.status,
      createdTime: generationTask.createdTime,
      completedTime: generationTask.completedTime,
      progress: generationTask.status === "COMPLETED" ? 100 : 0,
      imageUrl: currentImageUrl,
      imageId: imageInfo?._id?.toString() || "",
      width: imageInfo?.width || generationTask.params?.width || 0,
      height: imageInfo?.height || generationTask.params?.height || 0,
      prompt: generationTask.params?.prompt || "",
      underImageUrl: underImageUrl,
      negativePrompt: generationTask.params?.negativePrompt || "",
      referImageUrl: referImageUrl,
      modelOutwardName: generationTask.params?.modelOutwardName || "",
      styleModelOutwardName: generationTask.params?.styleModelOutwardName || "",
      magnificationOutward: generationTask.params?.magnificationOutward,
      scene: generationTask.params?.scene || "",
    } : null;

    let avatar = userInfo?.avatar || "";
    if (avatar && /^[0-9a-fA-F]{24}$/.test(avatar)) {
      const file = await FileResource.findById(avatar).lean();
      if (file) avatar = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
    }

    sendResponse.success(ctx, {
      id: square._id?.toString(),
      isOwner: userId === String(square.userId),
      username: userInfo?.nickname || userInfo?.username || "匿名用户",
      title: square.title || "",
      caption: square.caption || "",
      styleTags: Array.isArray(square.styleTags) ? square.styleTags.join(",") : "",
      sceneTags: Array.isArray(square.sceneTags) ? square.sceneTags.join(",") : "",
      drawTaskInfo: taskDetail,
      editedTaskInfo: null,
      squareImage: {
        id: imageInfo?._id?.toString() || square.imageId?.toString() || "",
        fileResourceId: imageInfo?.fileResourceId || "",
        imageUrl: currentImageUrl,
      },
      publishedTime: square.publishedTime,
      updateTime: square.publishedTime,
      auditStatus: "PASS",
      collectCount: square.collectCount || 0,
      isCollected: !!isCollected,
      avatar: avatar,
    });
  } catch (error: any) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 发布作品到广场
 * 验证图片存在且属于当前用户
 */
export const publishSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const userId = user?._id;
  const { title, caption, imageId, styleTags, sceneTags } = ctx.request.body as any;

  if (!imageId) {
      ctx.body = { code: 400, msg: "imageId is required" };
      return;
  }

  // 验证图片存在
  const imageInfo = await ImageGenInfo.findById(imageId);
  if (!imageInfo) {
      ctx.body = { code: 404, msg: "Image not found" };
      return;
  }

  // 验证所有权
  if (imageInfo.userId && imageInfo.userId !== userId) {
      ctx.body = { code: 403, msg: "You can only publish your own images" };
      return;
  }

  // 检查是否已发布到广场
  if (imageInfo.isPublishedToSquare) {
      ctx.body = { code: 400, msg: "Image already published to square" };
      return;
  }

  const square = new Square({
    userId,
    imageId: imageInfo._id,
    imageUrl: imageInfo.fileResourceId
      ? buildObjectPublicUrl(BUCKET_NAME, imageInfo.fileResourceId)
      : imageInfo.imageUrl,
    title,
    caption,
    styleTags,
    sceneTags,
    publishedTime: new Date()
  });

  await square.save();

  // 更新图片的发布状态
  await ImageGenInfo.findByIdAndUpdate(imageId, { isPublishedToSquare: true });

  const result = square.toObject();
  const { _id, userId: authorId, imageId: imgId, ...rest } = result;
  sendResponse.success(ctx, { ...rest, id: String(_id) });
};

/**
 * 删除广场作品
 * 只能删除自己的作品
 */
export const deleteSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const userId = user?._id;
  const { id } = ctx.params;

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  if (square.userId !== userId) {
    ctx.body = { code: 403, msg: 'Permission denied' };
    return;
  }

  await Square.findByIdAndDelete(id);

  // 更新图片的发布状态
  await ImageGenInfo.findByIdAndUpdate(square.imageId, { isPublishedToSquare: false });

  sendResponse.success(ctx, { msg: 'Deleted successfully' });
};

/**
 * 点赞/取消点赞广场作品
 */
export const likeSquare = async (ctx: Context) => {
  const { id } = ctx.params;
  const userId = ctx.state.user?._id;
  const { action: requestAction } = ctx.request.body as any;

  if (!userId) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: 'Please login first' };
    return;
  }

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  // 检查是否已收藏
  const existingCollect = await UserSquareCollect.findOne({ userId, squareId: id });
  
  // 确定 action
  let action = requestAction;
  if (!action) {
    action = existingCollect ? 'unlike' : 'like';
  }

  if (action === 'like') {
    if (!existingCollect) {
      await UserSquareCollect.create({ userId, squareId: id });
      square.collectCount = (square.collectCount || 0) + 1;
      square.likeCount = (square.likeCount || 0) + 1;
      await square.save();
    }
  } else {
    if (existingCollect) {
      await UserSquareCollect.deleteOne({ _id: existingCollect._id });
      square.collectCount = Math.max(0, (square.collectCount || 0) - 1);
      square.likeCount = Math.max(0, (square.likeCount || 0) - 1);
      await square.save();
    }
  }

  sendResponse.success(ctx, {
    collectCount: square.collectCount,
    likeCount: square.likeCount,
    isCollected: action === 'like'
  });
};
