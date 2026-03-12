import {sign, verify} from 'jsonwebtoken';
import {IUser} from "@/models/user";
import {Context} from "koa";

export const SECRET_KEY = "morpheus-ai-secret";

// Get token from header
export const getToken = (ctx: Context) => {
  const authHeader = ctx.request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return '';
}

// Sign token
export const signToken = (userInfo: IUser) => {
  const tokenPayload = {
    uid: userInfo._id,
    username: userInfo.username,
    role: userInfo.role
  };
  const token = sign(tokenPayload, SECRET_KEY, {expiresIn: '30d'});
  return token;
};

// Verify token
export const verifyToken = (token: string) => {
  try {
    return verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}
