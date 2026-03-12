import { Context } from "koa";
import Square from "@/models/square";

export const getSquareList = async (ctx: Context) => {
  const { page = 1, pageSize = 20 } = ctx.query;
  const list = await Square.find()
    .sort({ publishedTime: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  const total = await Square.countDocuments();
  ctx.body = { code: 200, data: { list, total } };
};

export const publishSquare = async (ctx: Context) => {
  const user = ctx.state.user;
  const { title, caption, imageUrl, styleTags, sceneTags } = ctx.request.body as any;
  
  const square = new Square({
    userId: user.uid,
    title,
    caption,
    imageUrl,
    styleTags,
    sceneTags
  });
  
  await square.save();
  ctx.body = { code: 200, data: square };
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
