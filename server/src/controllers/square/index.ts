import { Context } from "koa";
import Square from "@/models/square";
import ImageGenInfo from "@/models/imageGenInfo";

export const getSquareList = async (ctx: Context) => {
  const { page = 1, pageSize = 20, styleTags, sceneTags } = ctx.query;
  
  const filter: any = {};
  
  // Style Tags Filter
  if (styleTags) {
      const tags = (styleTags as string).split(',').filter(t => t.trim());
      if (tags.length > 0) {
          filter.styleTags = { $in: tags };
      }
  }
  
  // Scene Tags Filter
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

export const publishSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const { title, caption, imageId, styleTags, sceneTags } = ctx.request.body as any;
  
  if (!imageId) {
      ctx.body = { code: 400, msg: "imageId is required" };
      return;
  }

  console.log(`[DEBUG] publishSquare imageId: ${imageId}`);

  // Verify image exists
  const imageInfo = await ImageGenInfo.findById(imageId);
  console.log(`[DEBUG] imageInfo found: ${!!imageInfo}`);
  if (!imageInfo) {
      ctx.body = { code: 404, msg: "Image not found" };
      return;
  }

  // Verify ownership (optional but recommended)
  if (imageInfo.userId && imageInfo.userId !== user.uid) {
      ctx.body = { code: 403, msg: "You can only publish your own images" };
      return;
  }
  
  const square = new Square({
    userId: user.uid,
    imageId: imageInfo._id,
    imageUrl: imageInfo.imageUrl, // Denormalize for easier access
    title,
    caption,
    styleTags,
    sceneTags,
    publishedTime: new Date()
  });
  
  await square.save();
  ctx.body = { code: 200, data: square };
};

export const deleteSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const { id } = ctx.params;

  const square = await Square.findById(id);
  if (!square) {
    ctx.body = { code: 404, msg: 'Not found' };
    return;
  }

  // 验证是否是自己的作品
  if (square.userId !== user.uid) {
    ctx.body = { code: 403, msg: 'Permission denied' };
    return;
  }

  await Square.findByIdAndDelete(id);
  ctx.body = { code: 200, msg: 'Deleted successfully' };
};

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
