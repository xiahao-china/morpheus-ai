import { Context } from "koa";
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import { SMS_CONFIG, REDIS_KEYS, USER_CONSTANTS } from "@/config/index";
import { sendSMS, sendEmail } from "./const";

/**
 * 发送验证码
 * type: 'phone' | 'email'
 * 测试环境下验证码固定为 666666
 */
export const sendVerifyCode = async (ctx: Context) => {
  const { type, target } = ctx.request.body as any;

  const isMock = SMS_CONFIG.mockSend;
  const code = isMock ? '666666' : Math.floor(100000 + Math.random() * 900000).toString();

  if (type === 'phone') {
    if (!isMock) {
      await sendSMS(target, code);
    }
    // 验证码存入 Redis，有效期 5 分钟
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

/**
 * 用户登录
 * 支持：用户名密码登录、短信验证码登录、邮箱验证码登录
 * 登录成功设置 Cookie（有效期 30 天）
 */
export const login = async (ctx: Context) => {
  const { type, target, code, password } = ctx.request.body as any;

  // 用户名密码登录
  if (type === 'username') {
      const user = await User.findOne({ username: target });
      if (!user || user.password !== password) {
          ctx.body = { code: 401, msg: 'Invalid username or password' };
          return;
      }
      const token = signToken(user);

      // 设置 Cookie
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      ctx.cookies.set('token', token, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
      });

      ctx.body = { code: 200, data: { user } };
      return;
  }

  // 验证码登录
  let redisKey = '';
  if (type === 'phone') {
    redisKey = `${REDIS_KEYS.SMS_LOGIN_CODE}${target}`;
  } else if (type === 'email') {
    redisKey = `${REDIS_KEYS.EMAIL_LOGIN_CODE}${target}`;
  }

  const storedCode = await redis.get(redisKey);

  // 测试环境允许 666666
  if (SMS_CONFIG.mockSend && code === '666666') {
      // 通过
  } else if (!storedCode || storedCode !== code) {
    ctx.body = { code: 401, msg: 'Invalid verification code' };
    return;
  }

  // 查找或创建用户
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

  // 设置 Cookie
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  ctx.cookies.set('token', token, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  });

  ctx.body = { code: 200, data: { user } };
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (ctx: Context) => {
    const user = ctx.state.user;
    const dbUser = await User.findById(user._id);
    ctx.body = { code: 200, data: dbUser };
}

/**
 * 更新用户信息
 * 可更新：昵称、头像、个性签名
 */
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
      { new: true }
    );

    ctx.body = { code: 200, data: updatedUser };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};