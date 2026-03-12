import { Context, Next } from 'koa';
import { verifyToken, getToken } from '@/utils/token';

export const authMiddleware = async (ctx: Context, next: Next) => {
  const token = getToken(ctx);
  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: 'Authentication Error' };
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: 'Invalid Token' };
    return;
  }

  ctx.state.user = decoded;
  await next();
};
