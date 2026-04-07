import { Context as KoaContext, Next } from "koa";
type Context = KoaContext | any;
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

/**
 * 可选认证中间件
 * 如果请求携带有效 Token，则解析用户信息到 ctx.state.user
 * 如果没有 Token 或 Token 无效，不报错，继续执行后续逻辑
 */
export const optionalAuthMiddleware = async (ctx: Context, next: Next) => {
  const token = getToken(ctx);
  if (token) {
    const decoded = verifyToken(token) as any;
    if (decoded) {
      if (decoded.uid && !decoded._id) {
        decoded._id = decoded.uid;
      }
      ctx.state.user = decoded;
    }
  }
  await next();
};
