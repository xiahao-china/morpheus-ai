import { Context, Next } from 'koa';
import { verifyToken, getToken } from '@/utils/token';

export const authMiddleware = async (ctx: Context, next: Next) => {
  const token = getToken(ctx);
  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: 'Authentication Error' };
    return;
  }

  const decoded = verifyToken(token) as any;
  if (!decoded) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: 'Invalid Token' };
    return;
  }
  
  // 兼容旧 Token 中的 uid 字段
  if (decoded.uid && !decoded._id) {
    decoded._id = decoded.uid;
  }

  ctx.state.user = decoded;
  await next();
};
