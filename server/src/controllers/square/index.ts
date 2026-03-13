import { Context } from "koa";
import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";

/**
 * 获取广场列表（支持风格和场景标签筛选）
 */
export const getSquareList = async (ctx: Context) => {
  const { page = 1, pageSize = 20, styleTags, sceneTags } = ctx.query;

  const filter: any = {};

  // 风格标签筛选
  if (styleTags) {
      const tags = (styleTags as string).split(',').filter(t => t.trim());
      if (tags.length > 0) {
          filter.styleTags = { $in: tags };
      }
  }

  // 场景标签筛选
  if (sceneTags) {
      const tags = (sceneTags as string).split(',').filter(t => t.trim());
      if (tags.length > 0) {
          filter.sceneTags = { $in: tags };
      }
  }

  const list = await Square.find(filter)
    .sort({ publishedTime: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  const total = await Square.countDocuments(filter);
  ctx.body = { code: 200, data: { list, total } };
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
  ctx.body = { code: 200, data: square };
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
  ctx.body = { code: 200, msg: 'Deleted successfully' };
};

/**
 * 点赞/取消点赞广场作品
 */
export const likeSquare = async (ctx: Context) => {
  const { id } = ctx.params;
  const { action } = ctx.request.body as any; // 'like' or 'unlike'

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  if (action === 'like') {
    square.likeCount = (square.likeCount || 0) + 1;
  } else {
    square.likeCount = Math.max(0, (square.likeCount || 0) - 1);
  }

  await square.save();
  ctx.body = { code: 200, data: square };
};