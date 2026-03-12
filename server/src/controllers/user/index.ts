import { Context } from "koa";
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import axios from "axios";
import qs from "qs";
import { SMS_CONFIG, REDIS_KEYS, USER_CONSTANTS } from "@/config/index";

// Real SMS send via 1cloudsp
const sendSMS = async (phone: string, code: string) => {
  if (SMS_CONFIG.mockSend) {
    logger.info(`[MOCK] Sending SMS to ${phone}: ${code}`);
    return true;
  }

  logger.info(`Sending SMS to ${phone}: ${code}`);
  
  try {
    const data = {
      accesskey: SMS_CONFIG.accesskey,
      secret: SMS_CONFIG.secret,
      sign: SMS_CONFIG.sign,
      templateId: SMS_CONFIG.templateId,
      mobile: phone,
      content: code
    };

    const response = await axios.post(SMS_CONFIG.baseUrl, qs.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    });

    logger.info(`SMS Response: ${JSON.stringify(response.data)}`);
    
    if (response.data && response.data.code === "0") {
      return true;
    } else {
      logger.error(`SMS Send Failed: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logger.error(`SMS Send Error: ${error}`);
    return false;
  }
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
    await redis.set(`${REDIS_KEYS.SMS_LOGIN_CODE}${target}`, code, 'EX', USER_CONSTANTS.VERIFY_CODE_EXPIRE_SECONDS);
  } else if (type === 'email') {
    await sendEmail(target, code);
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
     // Allow mock login
  } else if (!storedCode || storedCode !== code) {
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
