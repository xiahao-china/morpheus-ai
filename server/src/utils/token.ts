import {sign, verify} from 'jsonwebtoken';
import {IUser} from "@/models/user";
import {Context} from "koa";
import { serverConfig } from "@/utils/common";

/**
 * JWT密钥
 * 用于签名和验证Token，从配置中读取，默认为 "morpheus-ai-secret"
 */
export const SECRET_KEY = serverConfig.auth?.secret || "morpheus-ai-secret";

/**
 * 从请求头中获取Token
 * @param ctx - Koa Context 对象
 * @returns Token字符串，如果没有则返回空字符串
 */
export const getToken = (ctx: Context) => {
  // 1. 尝试从 Authorization 请求头中获取 Bearer Token
  const authHeader = ctx.request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 去掉 "Bearer " 前缀返回纯Token
    return authHeader.substring(7);
  }
  
  // 2. 尝试从 Cookie 中获取 Token
  const cookieToken = ctx.cookies.get('token');
  if (cookieToken) {
    return cookieToken;
  }
  
  return '';
}

/**
 * 生成Token
 * @param userInfo - 用户信息对象
 * @returns 签名的JWT Token，有效期30天
 */
export const signToken = (userInfo: IUser) => {
  const tokenPayload = {
    uid: userInfo._id,        // 用户ID (兼容旧代码)
    _id: userInfo._id,        // 用户ID (Mongoose标准)
    username: userInfo.username, // 用户名
    role: userInfo.role       // 用户角色
  };
  // 签发有效期为30天的Token
  const token = sign(tokenPayload, SECRET_KEY, {expiresIn: '30d'});
  return token;
};

/**
 * 验证Token
 * @param token - JWT Token字符串
 * @returns 解析后的Payload，验证失败返回null
 */
export const verifyToken = (token: string) => {
  try {
    return verify(token, SECRET_KEY);
  } catch (err) {
    // 验证失败返回null
    return null;
  }
}