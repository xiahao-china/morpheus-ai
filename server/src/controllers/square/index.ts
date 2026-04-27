import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";
import GenerationTask from "@/models/generationTask";
import User from "@/models/user";
import FileResource from "@/models/fileResource";
import UserSquareCollect from "@/models/userSquareCollect";
import { BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";
import { sendResponse } from "@/utils/const";
import { buildSquareFilter, Context, getNextLikeCount } from "./const";
import { parsePositiveInt } from "../generation/const";

/**
 * 获取广场列表（支持风格和场景标签筛选）
 */
export const getSquareList = async (ctx: Context) => {
  try {
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
  }, {} as Record<string, { _id: any; fileResourceId?: string; imageUrl?: string; url128?: string; url256?: string; url512?: string; }>);

  const avatarIds = Array.from(new Set(userList.map((user) => user.avatar).filter((avatar) => avatar && /^[0-9a-fA-F]{24}$/.test(avatar))));
  const fileResources = avatarIds.length ? await FileResource.find({ _id: { $in: avatarIds } }).lean() : [];
  const fileResourceMap = fileResources.reduce((map, file) => {
    map[String(file._id)] = {
      url: buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path),
      url128: file.url128,
      url256: file.url256,
      url512: file.url512
    };
    return map;
  }, {} as Record<string, any>);

  // 针对 image 的 fileResourceId 有可能是 ObjectId 的情况
  const imageFileResourceIds = imageList
    .map(img => img.fileResourceId)
    .filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));
  const imageFileResources = imageFileResourceIds.length ? await FileResource.find({ _id: { $in: imageFileResourceIds } }).lean() : [];
  const imageFileResourceMap = imageFileResources.reduce((map, file) => {
    map[String(file._id)] = {
      url: buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path),
      url128: file.url128,
      url256: file.url256,
      url512: file.url512
    };
    return map;
  }, {} as Record<string, any>);

  const list = rawList.map((item) => {
    const user = userMap[String(item.userId || "")];
    const image = imageMap[String(item.imageId || "")];
    let imageUrl = image?.imageUrl || item.imageUrl || "";
    let url128 = image?.url128 || "";
    let url256 = image?.url256 || "";
    let url512 = image?.url512 || "";

    if (image?.fileResourceId) {
      if (/^[0-9a-fA-F]{24}$/.test(image.fileResourceId)) {
        const fileInfo = imageFileResourceMap[image.fileResourceId];
        if (fileInfo) {
          imageUrl = fileInfo.url;
          url128 = fileInfo.url128 || url128;
          url256 = fileInfo.url256 || url256;
          url512 = fileInfo.url512 || url512;
        }
      } else {
        imageUrl = buildObjectPublicUrl(BUCKET_NAME, image.fileResourceId);
      }
    }

    let avatar = user?.avatar || "";
    let avatar128 = "";
    let avatar256 = "";
    let avatar512 = "";
    if (avatar && fileResourceMap[avatar]) {
      const avatarInfo = fileResourceMap[avatar];
      avatar = avatarInfo.url;
      avatar128 = avatarInfo.url128 || "";
      avatar256 = avatarInfo.url256 || "";
      avatar512 = avatarInfo.url512 || "";
    }
    const authorId = item.userId;
    return {
      ...item,
      id: String(item._id),
      imageUrl,
      url128,
      url256,
      url512,
      username: user?.nickname || user?.username || "匿名用户",
      avatar,
      avatar128,
      avatar256,
      avatar512,
      isCollected: userCollectionSet.has(String(item._id)),
      isOwner: currentUserId === String(authorId),
    };
  });
  sendResponse.success(ctx, { list, total });
  } catch (error: any) {
    console.error("Error in getSquareList:", error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取用户的广场作品发布列表
 */
export const getMyPublished = async (ctx: Context) => {
  try {
    const userId = ctx.state.user?._id;
    const page = parsePositiveInt(ctx.query.pageNo || ctx.query.page, 1);
    const pageSize = parsePositiveInt(ctx.query.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const [rawList, total] = await Promise.all([
      Square.find({ userId })
        .sort({ publishedTime: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Square.countDocuments({ userId })
    ]);

    const imageIds = rawList.map((item) => item.imageId).filter(Boolean);
    const images = imageIds.length
      ? await ImageGenInfo.find({ _id: { $in: imageIds } }).lean()
      : [];

    const imageMap = images.reduce((map, image) => {
      map[String(image._id)] = image;
      return map;
    }, {} as Record<string, any>);

    // 处理文件资源(图片)
    const imageFileResourceIds = images
      .map(img => img.fileResourceId)
      .filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));
    const imageFileResources = imageFileResourceIds.length ? await FileResource.find({ _id: { $in: imageFileResourceIds } }).lean() : [];
    const imageFileResourceMap = imageFileResources.reduce((map, file) => {
      map[String(file._id)] = {
        url: buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path),
        url128: file.url128,
        url256: file.url256,
        url512: file.url512
      };
      return map;
    }, {} as Record<string, any>);

    // 获取用户基本信息用于头像和用户名
    const user = await User.findById(userId).lean();
    let avatarUrl = null;
    if (user?.avatar && /^[0-9a-fA-F]{24}$/.test(user.avatar)) {
      const file = await FileResource.findById(user.avatar).lean();
      if (file) {
        avatarUrl = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
      }
    }

    const records = rawList.map((item) => {
      const image = imageMap[item.imageId];
      let imageUrl = image?.imageUrl || item.imageUrl || "";
      let scaleThumbnailUrl = image?.url256 || image?.url128 || "";

      if (image?.fileResourceId) {
        if (/^[0-9a-fA-F]{24}$/.test(image.fileResourceId)) {
          const fileInfo = imageFileResourceMap[image.fileResourceId];
          if (fileInfo) {
            imageUrl = fileInfo.url;
            scaleThumbnailUrl = fileInfo.url256 || fileInfo.url128 || fileInfo.url;
          }
        } else {
          imageUrl = buildObjectPublicUrl(BUCKET_NAME, image.fileResourceId);
          scaleThumbnailUrl = imageUrl;
        }
      }

      return {
        id: item._id, // 前端接收 id 为 number 或 string 均可
        userId: item.userId,
        avatar: avatarUrl,
        username: user?.nickname || user?.username || "匿名用户",
        collectCount: item.collectCount || 0,
        isCollected: false, // 自己发布的，在我的发布列表中可以默认或另查
        squareImage: {
          id: image?._id || item.imageId,
          fileResourceId: image?.fileResourceId || "",
          imageUrl,
          scaleThumbnailUrl,
        },
        publishedTime: item.publishedTime?.getTime() || Date.now(),
      };
    });

    sendResponse.success(ctx, {
      records,
      total,
      page,
      size: pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error: any) {
    console.error("Error in getMyPublished:", error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取用户的广场作品收藏列表
 */
export const getMySquareCollections = async (ctx: Context) => {
  try {
    const userId = ctx.state.user?._id;
    const page = parsePositiveInt(ctx.query.page, 1);
    const pageSize = parsePositiveInt(ctx.query.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const [collections, total] = await Promise.all([
      UserSquareCollect.find({ userId })
        .sort({ createdTime: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      UserSquareCollect.countDocuments({ userId })
    ]);

    const squareIds = collections.map((item) => item.squareId);
    const squares = squareIds.length
      ? await Square.find({ _id: { $in: squareIds } }).lean()
      : [];

    const squareMap = squares.reduce((map, square) => {
      map[String(square._id)] = square;
      return map;
    }, {} as Record<string, any>);

    const imageIds = squares.map((item) => item.imageId).filter(Boolean);
    const images = imageIds.length
      ? await ImageGenInfo.find({ _id: { $in: imageIds } }).lean()
      : [];

    // 针对 fileResourceId 可能是 ObjectId 的情况
    const imageFileResourceIds = images
      .map(img => img.fileResourceId)
      .filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));
    const imageFileResources = imageFileResourceIds.length ? await FileResource.find({ _id: { $in: imageFileResourceIds } }).lean() : [];
    const imageFileResourceMap = imageFileResources.reduce((map, file) => {
      map[String(file._id)] = {
        url: buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path),
        url128: file.url128,
        url256: file.url256,
        url512: file.url512
      };
      return map;
    }, {} as Record<string, any>);

    const imageMap = images.reduce((map, image) => {
      map[String(image._id)] = image;
      return map;
    }, {} as Record<string, any>);

    const mappedList = collections.map((item) => {
      const square = squareMap[item.squareId];
      const image = square ? imageMap[square.imageId] : null;
      let imageUrl = image?.imageUrl || square?.imageUrl || "";
      let url128 = image?.url128 || "";
      let url256 = image?.url256 || "";
      let url512 = image?.url512 || "";

      if (image?.fileResourceId) {
        if (/^[0-9a-fA-F]{24}$/.test(image.fileResourceId)) {
          const fileInfo = imageFileResourceMap[image.fileResourceId];
          if (fileInfo) {
            imageUrl = fileInfo.url;
            url128 = fileInfo.url128 || url128;
            url256 = fileInfo.url256 || url256;
            url512 = fileInfo.url512 || url512;
          }
        } else {
          imageUrl = buildObjectPublicUrl(BUCKET_NAME, image.fileResourceId);
        }
      }

      return {
        imageId: image?._id?.toString() || square?.imageId || "",
        imageGenTaskId: image?.imageGenTaskId || "",
        imageUrl,
        url128,
        url256,
        url512,
        fileResourceId: image?.fileResourceId || "",
        width: image?.width || 0,
        height: image?.height || 0,
        isLiked: Boolean(image?.isLiked),
        isCollected: true,
        collectedTime: item.createdTime,
        // 返回 squareId 供前端可能有特殊需求使用
        squareId: item.squareId,
      };
    });
    const list = mappedList.filter((item) => item.imageUrl);

    sendResponse.success(ctx, {
      list,
      records: list, // 兼容前端字段
      total,
      page,
      pageSize,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: any) {
    console.error("Error in getMySquareCollections:", error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取广场详情
 */
export const getSquareDetail = async (ctx: Context) => {

  try {
    const { id } = ctx.params;
    if (!id || id === 'undefined') {
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

    let currentImageUrl = imageInfo?.imageUrl || square.imageUrl || "";
    let url128 = imageInfo?.url128 || "";
    let url256 = imageInfo?.url256 || "";
    let url512 = imageInfo?.url512 || "";

    if (imageInfo?.fileResourceId) {
      if (/^[0-9a-fA-F]{24}$/.test(imageInfo.fileResourceId)) {
        const file = await FileResource.findById(imageInfo.fileResourceId).lean();
        if (file) {
          currentImageUrl = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
          url128 = file.url128 || url128;
          url256 = file.url256 || url256;
          url512 = file.url512 || url512;
        }
      } else {
        currentImageUrl = buildObjectPublicUrl(BUCKET_NAME, imageInfo.fileResourceId);
      }
    }

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
    let avatar128 = "";
    let avatar256 = "";
    let avatar512 = "";
    if (avatar && /^[0-9a-fA-F]{24}$/.test(avatar)) {
      const file = await FileResource.findById(avatar).lean();
      if (file) {
        avatar = buildObjectPublicUrl(file.bucket || BUCKET_NAME, file.path);
        avatar128 = file.url128 || "";
        avatar256 = file.url256 || "";
        avatar512 = file.url512 || "";
      }
    }

    sendResponse.success(ctx, {
      id: square._id?.toString(),
      userId: square.userId || null,
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
        url128,
        url256,
        url512,
      },
      publishedTime: square.publishedTime,
      updateTime: square.publishedTime,
      auditStatus: "PASS",
      collectCount: square.collectCount || 0,
      isCollected: !!isCollected,
      avatar: avatar,
      avatar128,
      avatar256,
      avatar512,
    });
  } catch (error: any) {
    console.error("Error in getSquareDetail:", error);
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

  if (!title) {
      ctx.body = { code: 400, msg: "title is required" };
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

  if (!id || id === 'undefined') {
    ctx.body = { code: 400, msg: 'id is required' };
    return;
  }

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

  if (!id || id === 'undefined') {
    ctx.body = { code: 400, msg: 'id is required' };
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
