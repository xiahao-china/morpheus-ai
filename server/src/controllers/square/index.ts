import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";
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
