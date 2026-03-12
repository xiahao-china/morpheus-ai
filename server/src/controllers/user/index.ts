import { Context } from "koa";
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";

// Mock SMS send
const sendSMS = async (phone: string, code: string) => {
  logger.info(`Sending SMS to ${phone}: ${code}`);
  return true;
};

// Mock Email send
const sendEmail = async (email: string, code: string) => {
  logger.info(`Sending Email to ${email}: ${code}`);
  return true;
};

export const sendVerifyCode = async (ctx: Context) => {
  const { type, target } = ctx.request.body as any; // type: 'phone' | 'email'
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  if (type === 'phone') {
    await sendSMS(target, code);
    await redis.set(`verify:phone:${target}`, code, 'EX', 300); // 5 mins
  } else if (type === 'email') {
    await sendEmail(target, code);
    await redis.set(`verify:email:${target}`, code, 'EX', 300);
  } else {
    ctx.body = { code: 400, msg: 'Invalid type' };
    return;
  }
  
  ctx.body = { code: 200, msg: 'Code sent' };
};

export const login = async (ctx: Context) => {
  const { type, target, code, password } = ctx.request.body as any;
  // type: 'phone' | 'email' | 'username'
  
  if (type === 'username') {
      // Password login
      const user = await User.findOne({ username: target });
      if (!user || user.password !== password) {
          ctx.body = { code: 401, msg: 'Invalid username or password' };
          return;
      }
      const token = signToken(user);
      ctx.body = { code: 200, data: { token, user } };
      return;
  }

  // Code login
  const storedCode = await redis.get(`verify:${type}:${target}`);
  // For testing, allow '123456' if configured or just stick to logic.
  // I will just use the logic.
  if (!storedCode || storedCode !== code) {
    ctx.body = { code: 401, msg: 'Invalid code' };
    return;
  }
  
  // Auto create if not exists
  let user = await User.findOne({ [type]: target });
  if (!user) {
    user = new User({
      username: `user_${Date.now()}`,
      [type]: target,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.USER
    });
    await user.save();
  }
  
  const token = signToken(user);
  ctx.body = { code: 200, data: { token, user } };
};

export const getUserInfo = async (ctx: Context) => {
  const user = ctx.state.user; // Set by middleware
  if (!user) {
      ctx.body = { code: 401, msg: 'Unauthorized' };
      return;
  }
  const userInfo = await User.findById(user.uid);
  ctx.body = { code: 200, data: userInfo };
};

export const updateUserInfo = async (ctx: Context) => {
  const user = ctx.state.user;
  const updateData = ctx.request.body as any;
  
  // Prevent updating sensitive fields
  delete updateData.password;
  delete updateData.role;
  delete updateData.username;
  
  const updatedUser = await User.findByIdAndUpdate(user.uid, updateData, { new: true });
  ctx.body = { code: 200, data: updatedUser };
};
