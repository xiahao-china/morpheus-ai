import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";
import GenerationTask from "@/models/generationTask";
import User from "@/models/user";
import { sendResponse } from "@/utils/const";
import { buildSquareFilter, Context, getNextLikeCount } from "./const";

/**
 * 获取广场列表（支持风格和场景标签筛选）
 */
export const getSquareList = async (ctx: Context) => {
  const { page = 1, pageSize = 20, styleTags, sceneTags } = ctx.query;
  const filter = buildSquareFilter(styleTags, sceneTags);

  const list = await Square.find(filter)
    .sort({ publishedTime: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  const total = await Square.countDocuments(filter);
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

    const [userInfo, imageInfo] = await Promise.all([
      square.userId ? User.findById(square.userId).lean() : null,
      square.imageId ? ImageGenInfo.findById(square.imageId).lean() : null,
    ]);

    const imageGenTaskId = imageInfo?.imageGenTaskId;
    const generationTask = imageGenTaskId
      ? await GenerationTask.findById(imageGenTaskId).lean()
      : null;

    const taskDetail = generationTask ? {
      taskId: generationTask._id?.toString(),
      status: generationTask.status,
      createdTime: generationTask.createdTime,
      completedTime: generationTask.completedTime,
      progress: generationTask.status === "COMPLETED" ? 100 : 0,
      imageUrl: imageInfo?.imageUrl || square.imageUrl || "",
      imageId: imageInfo?._id?.toString() || "",
      width: imageInfo?.width || generationTask.params?.width || 0,
      height: imageInfo?.height || generationTask.params?.height || 0,
      prompt: generationTask.params?.prompt || "",
      underImageUrl: generationTask.params?.baseImages?.[0] || "",
      negativePrompt: generationTask.params?.negativePrompt || "",
      referImageUrl: generationTask.params?.referImage?.url || "",
      modelOutwardName: generationTask.params?.modelOutwardName || "",
      styleModelOutwardName: generationTask.params?.styleModelOutwardName || "",
      magnificationOutward: generationTask.params?.magnificationOutward,
      scene: generationTask.params?.scene || "",
    } : null;

    sendResponse.success(ctx, {
      id: square._id?.toString(),
      userId: square.userId || null,
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
        imageUrl: imageInfo?.imageUrl || square.imageUrl || "",
      },
      publishedTime: square.publishedTime,
      updateTime: square.publishedTime,
      auditStatus: "PASS",
      collectCount: square.collectCount || 0,
      isCollected: false,
      avatar: userInfo?.avatar || "",
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
  if (imageInfo.userId && imageInfo.userId !== user.uid) {
      ctx.body = { code: 403, msg: "You can only publish your own images" };
      return;
  }

  // 检查是否已发布到广场
  if (imageInfo.isPublishedToSquare) {
      ctx.body = { code: 400, msg: "Image already published to square" };
      return;
  }

  const square = new Square({
    userId: user.uid,
    imageId: imageInfo._id,
    imageUrl: imageInfo.imageUrl,
    title,
    caption,
    styleTags,
    sceneTags,
    publishedTime: new Date()
  });

  await square.save();

  // 更新图片的发布状态
  await ImageGenInfo.findByIdAndUpdate(imageId, { isPublishedToSquare: true });

  sendResponse.success(ctx, square);
};

/**
 * 删除广场作品
 * 只能删除自己的作品
 */
export const deleteSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const { id } = ctx.params;

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  if (square.userId !== user.uid) {
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
  const { action } = ctx.request.body as any;

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  square.likeCount = getNextLikeCount(action, square.likeCount || 0);

  await square.save();
  sendResponse.success(ctx, square);
};
