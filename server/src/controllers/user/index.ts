import { Context } from "koa";
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import { SMS_CONFIG, REDIS_KEYS, USER_CONSTANTS } from "@/config/index";
import { sendSMS, sendEmail } from "./const";

export const sendVerifyCode = async (ctx: Context) => {
  const { type, target } = ctx.request.body as any; // type: 'phone' | 'email'
  
  // 区分正式和测试环境
  // 测试环境(SMS_CONFIG.mockSend = true)时，验证码固定为 666666
  const isMock = SMS_CONFIG.mockSend;
  const code = isMock ? '666666' : Math.floor(100000 + Math.random() * 900000).toString();
  
  if (type === 'phone') {
    if (!isMock) {
      await sendSMS(target, code);
    }
    await redis.set(`${REDIS_KEYS.SMS_LOGIN_CODE}${target}`, code, 'EX', USER_CONSTANTS.VERIFY_CODE_EXPIRE_SECONDS);
  } else if (type === 'email') {
    if (!isMock) {
      await sendEmail(target, code);
    }
    await redis.set(`${REDIS_KEYS.EMAIL_LOGIN_CODE}${target}`, code, 'EX', USER_CONSTANTS.VERIFY_CODE_EXPIRE_SECONDS);
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
  let redisKey = '';
  if (type === 'phone') {
    redisKey = `${REDIS_KEYS.SMS_LOGIN_CODE}${target}`;
  } else if (type === 'email') {
    redisKey = `${REDIS_KEYS.EMAIL_LOGIN_CODE}${target}`;
  }

  const storedCode = await redis.get(redisKey);
  
  // For testing, allow '123456' if mockSend is enabled
  if (SMS_CONFIG.mockSend && code === '666666') {
      // Pass
  } else if (!storedCode || storedCode !== code) {
    ctx.body = { code: 401, msg: 'Invalid verification code' };
    return;
  }

  // Find or Create User
  let user = await User.findOne({ [type === 'phone' ? 'phone' : 'email']: target });
  if (!user) {
    user = new User({
      username: `User_${Date.now()}`,
      [type === 'phone' ? 'phone' : 'email']: target,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.USER
    });
    await user.save();
  }

  const token = signToken(user);
  ctx.body = { code: 200, data: { token, user } };
};

export const getUserInfo = async (ctx: Context) => {
    const user = ctx.state.user;
    // Refresh user data from DB
    const dbUser = await User.findById(user._id);
    ctx.body = { code: 200, data: dbUser };
}

export const updateUserInfo = async (ctx: Context) => {
  const user = ctx.state.user;
  const { nickname, avatar, personalSignature } = ctx.request.body as any;
  
  try {
    const updateData: any = {};
    if (nickname) updateData.nickname = nickname;
    if (avatar) updateData.avatar = avatar;
    if (personalSignature) updateData.personalSignature = personalSignature;
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      { $set: updateData },
      { new: true } // Return updated document
    );
    
    ctx.body = { code: 200, data: updatedUser };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};
