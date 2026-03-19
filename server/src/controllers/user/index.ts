import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { sendEmail, sendSMS } from "./const";
import {
  buildVerifyCodeRedisKey,
  Context,
  generateVerifyCode,
  getLoginCookieOptions,
  getTargetFieldByType,
  getVerifyCodeExpireSeconds,
  isMockVerifyCode,
  LOGIN_COOKIE_KEY,
  shouldSendVerificationMessage,
  VERIFY_CODE_TYPE_EMAIL,
  VERIFY_CODE_TYPE_PHONE,
  VERIFY_CODE_TYPE_USERNAME
} from "./const";
import { sendResponse } from "@/utils/const";

/**
 * 发送验证码
 * type: 'phone' | 'email'
 * 测试环境下验证码固定为 666666
 */
export const sendVerifyCode = async (ctx: Context) => {
  const { type, target } = ctx.request.body as any;
  const code = generateVerifyCode();

  if (type === VERIFY_CODE_TYPE_PHONE) {
    if (shouldSendVerificationMessage()) {
      await sendSMS(target, code);
    }
    await redis.set(buildVerifyCodeRedisKey(type, target), code, "EX", getVerifyCodeExpireSeconds());
  } else if (type === VERIFY_CODE_TYPE_EMAIL) {
    if (shouldSendVerificationMessage()) {
      await sendEmail(target, code);
    }
    await redis.set(buildVerifyCodeRedisKey(type, target), code, "EX", getVerifyCodeExpireSeconds());
  } else {
    ctx.body = { code: 400, msg: 'Invalid type' };
    return;
  }

  sendResponse.success(ctx, { msg: 'Code sent' });
};

/**
 * 用户登录
 * 支持：用户名密码登录、短信验证码登录、邮箱验证码登录
 * 登录成功设置 Cookie（有效期 30 天）
 */
export const login = async (ctx: Context) => {
  const { type, target, code, password } = ctx.request.body as any;

  // 用户名密码登录
  if (type === VERIFY_CODE_TYPE_USERNAME) {
      const user = await User.findOne({ username: target });
      if (!user || user.password !== password) {
          ctx.body = { code: 401, msg: 'Invalid username or password' };
          return;
      }
      const token = signToken(user);
      ctx.cookies.set(LOGIN_COOKIE_KEY, token, getLoginCookieOptions());

      sendResponse.success(ctx, { user });
      return;
  }

  const redisKey = buildVerifyCodeRedisKey(type, target);
  if (!redisKey) {
    ctx.body = { code: 400, msg: "Invalid type" };
    return;
  }
  const storedCode = await redis.get(redisKey);

  if (isMockVerifyCode(code)) {
  } else if (!storedCode || storedCode !== code) {
    ctx.body = { code: 401, msg: 'Invalid verification code' };
    return;
  }

  const targetField = getTargetFieldByType(type);
  if (!targetField) {
    ctx.body = { code: 400, msg: "Invalid type" };
    return;
  }
  let user = await User.findOne({ [targetField]: target });
  if (!user) {
    user = new User({
      username: `User_${Date.now()}`,
      [targetField]: target,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.USER
    });
    await user.save();
  }

  const token = signToken(user);
  ctx.cookies.set(LOGIN_COOKIE_KEY, token, getLoginCookieOptions());

  sendResponse.success(ctx, { user });
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (ctx: Context) => {
    const user = ctx.state.user;
    const dbUser = await User.findById(user._id);
    sendResponse.success(ctx, dbUser as any);
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

    sendResponse.success(ctx, updatedUser as any);
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};
