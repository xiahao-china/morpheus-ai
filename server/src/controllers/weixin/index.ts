import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import { MINI_PROGRAM_CONFIG, MP_CONFIG, SMS_CONFIG } from "@/config/index";
import axios from "axios";
import { sendResponse } from "@/utils/const";
import { WXBizDataCrypt } from "@/utils/wechat-decrypt";
import {
  buildSmsLoginRedisKey,
  buildWechatAuthorizeUrl,
  buildWechatLoginCodeRedisKey,
  buildWechatLoginStateRedisKey,
  Context,
  createLoginSuccessHtml,
  createWechatState,
  WECHAT_LOGIN_CODE_EXPIRE_SECONDS,
  WECHAT_STATE_EXPIRE_SECONDS,
  WECHAT_TOKEN_API_URL,
  WECHAT_USER_INFO_API_URL,
  WECHAT_ACCESS_TOKEN_API_URL,
  WECHAT_GET_PHONE_NUMBER_URL
} from "./const";
import { LOGIN_COOKIE_KEY, getLoginCookieOptions } from "../user/const";

/**
 * 获取微信接口调用凭证 (Client Credential Access Token)
 * 优先从 Redis 获取，没有则向微信请求并缓存
 */
const getWechatAccessToken = async (config: { appId: string, appSecret: string }) => {
  const redisKey = `wechat_access_token:${config.appId}`;
  
  // 1. 尝试从 Redis 获取
  const cachedToken = await redis.get(redisKey);
  if (cachedToken) {
    return cachedToken;
  }

  // 2. 向微信请求新 Token
  const response = await axios.get(WECHAT_ACCESS_TOKEN_API_URL, {
    params: {
      grant_type: "client_credential",
      appid: config.appId,
      secret: config.appSecret
    },
    proxy: false
  });

  const { access_token, expires_in, errcode, errmsg } = response.data;

  if (errcode) {
    throw new Error(`[Wechat Access Token] API error: ${errcode}, ${errmsg}`);
  }

  // 3. 存入 Redis，提前 10 分钟过期
  const expireSeconds = Math.max((expires_in || 7200) - 600, 60);
  await redis.set(redisKey, access_token, "EX", expireSeconds);

  return access_token;
};

/**
 * 绑定手机号 - Web端微信登录后绑定手机号
 * 1. 验证短信验证码
 * 2. 检查手机号是否已被其他用户绑定
 * 3. 如已存在则合并账号，否则直接绑定
 */
export const bindPhone = async (ctx: Context) => {
  const { phone, code, inviteCode } = ctx.request.body as any;
  const currentUser = ctx.state.user;

  if (!phone || !code) {
    ctx.body = { code: 400, msg: "Missing phone or code" };
    return;
  }

  try {
    // 1. 验证验证码
    const redisKey = buildSmsLoginRedisKey(phone);
    const storedCode = await redis.get(redisKey);

    // 测试环境允许 666666
    const isMock = SMS_CONFIG.mockSend && code === '666666';

    if (!isMock && (!storedCode || storedCode !== code)) {
      ctx.body = { code: 400, msg: "Invalid verification code" };
      return;
    }

    // 删除验证码
    if (!isMock) await redis.del(redisKey);

    // 2. 获取当前用户
    const user = await User.findById(currentUser.uid);
    if (!user) {
        ctx.body = { code: 404, msg: "User not found" };
        return;
    }

    if (user.phone) {
        ctx.body = { code: 400, msg: "Current user already has a phone number" };
        return;
    }

    // 3. 检查手机号是否已被其他用户绑定
    const phoneUser = await User.findOne({ phone });
    let finalUser: IUser;

    if (phoneUser) {
        // 手机号已存在
        if (phoneUser.openid || phoneUser.unionId) {
             // 该手机号账号已绑定了微信 -> 冲突
             ctx.body = { code: 400, msg: "Phone number already bound to another Wechat account" };
             return;
        }

        // 手机号账号存在但未绑定微信 -> 合并账号
        if (user.openid) phoneUser.openid = user.openid;
        if (user.unionId) phoneUser.unionId = user.unionId;
        if (user.appOpenid) phoneUser.appOpenid = user.appOpenid;
        if (user.avatar && !phoneUser.avatar) phoneUser.avatar = user.avatar;
        if (user.nickname && !phoneUser.nickname) phoneUser.nickname = user.nickname;

        await phoneUser.save();

        // 删除当前的临时微信账号
        await User.findByIdAndDelete(user._id);

        finalUser = phoneUser;
    } else {
        // 手机号不存在 -> 直接绑定
        user.phone = phone;
        if (inviteCode) user.inviteCode = inviteCode;
        await user.save();
        finalUser = user;
    }

    // 4. 生成新 Token
    const token = signToken(finalUser);

    sendResponse.success(ctx, { token, user: finalUser });

  } catch (error) {
    logger.error(`[Wechat Bind Phone] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 微信小程序手机号一键登录 / 绑定手机号
 * 1. 尝试使用新 API (getuserphonenumber) 通过 code 获取手机号
 * 2. 如果失败，尝试使用 loginCode 换取 session_key 并结合 encryptedData 解密
 * 3. 根据 userId 绑定或查找/创建用户
 */
export const miniProgramLogin = async (ctx: Context) => {
  let { code, loginCode, encryptedData, iv, userId } = ctx.request.body as any;

  // 容错：如果前端没传 loginCode 但传了 code，且 encryptedData 存在，说明 code 可能是被误传的 loginCode
  if (!loginCode && code && encryptedData) {
    logger.info(`[Wechat Mini Login] No loginCode provided but encryptedData exists, treating code as loginCode`);
    loginCode = code;
    code = undefined; // 避免 code 被当作 phone code 调用报错
  }

  if (!code && !loginCode) {
    ctx.body = { code: 400, msg: "Missing code or loginCode parameter" };
    return;
  }

  try {
    let phone = null;
    let openid = null;
    let unionid = null;
    let sessionKey = null;

    // --- 步骤 1: 尝试获取手机号 ---
    
    // A. 优先尝试新 API (使用专门的 phone code)
    if (code) {
      try {
        const accessToken = await getWechatAccessToken(MINI_PROGRAM_CONFIG);
        const phoneResponse = await axios.post(`${WECHAT_GET_PHONE_NUMBER_URL}?access_token=${accessToken}`, {
          code
        }, {
          proxy: false
        });

        if (phoneResponse.data?.errcode === 0 && phoneResponse.data?.phone_info?.phoneNumber) {
          phone = phoneResponse.data.phone_info.phoneNumber;
          logger.info(`[Wechat Mini Login] Successfully got phone number via new API: ${phone}`);
        } else {
          logger.warn(`[Wechat Mini Login] New API failed (errcode: ${phoneResponse.data?.errcode}):`, phoneResponse.data?.errmsg);
        }
      } catch (e: any) {
        logger.error(`[Wechat Mini Login] New API exception:`, e.message);
      }
    }

    // B. 如果新 API 失败或未提供 code，且提供了 loginCode + encryptedData，尝试解密
    if (!phone && loginCode) {
      const wxResponse = await axios.get(MINI_PROGRAM_CONFIG.loginUrl, {
        params: {
          appid: MINI_PROGRAM_CONFIG.appId,
          secret: MINI_PROGRAM_CONFIG.appSecret,
          js_code: loginCode,
          grant_type: "authorization_code"
        },
        proxy: false
      });

      const { openid: _openid, session_key, unionid: _unionid, errcode, errmsg } = wxResponse.data;
      openid = _openid;
      unionid = _unionid;
      sessionKey = session_key;

      if (errcode) {
        logger.error(`[Wechat Mini Login] jscode2session error: ${errcode}, ${errmsg}`);
      } else if (encryptedData && iv && sessionKey) {
        try {
          const pc = new WXBizDataCrypt(MINI_PROGRAM_CONFIG.appId, sessionKey);
          const data = pc.decryptData(encryptedData, iv);
          phone = data.phoneNumber || data.purePhoneNumber;
          logger.info(`[Wechat Mini Login] Successfully decrypted phone number via old API: ${phone}`);
        } catch (e: any) {
          logger.error(`[Wechat Mini Login] Decryption failed:`, e.message);
        }
      }
    }

    // --- 步骤 2: 验证必要信息 ---
    // 如果既没拿到手机号，也没拿到 openid (jscode2session 失败)，则无法继续
    if (!phone && !openid) {
      ctx.body = { 
        code: 500, 
        msg: "Failed to obtain user info from Wechat", 
        data: { phoneObtained: !!phone, openidObtained: !!openid } 
      };
      return;
    }

    // --- 步骤 3: 用户绑定/创建逻辑 ---
    let user: IUser | null = null;

    // 1. 如果提供了 userId，则直接绑定到该用户
    if (userId && userId.length === 24) { // 检查是否为有效的 MongoDB ObjectId 长度
        user = await User.findById(userId);
        if (user) {
            if (phone) user.phone = phone;
            if (openid) user.appOpenid = openid;
            if (unionid) user.unionId = unionid;
            await user.save();
            logger.info(`[Wechat Mini Login] Bound phone/openid to existing user: ${userId}`);
        }
    }

    // 2. 如果没有 userId 或没找到，则通过 openid/unionid/phone 查找
    if (!user) {
        if (unionid) {
            user = await User.findOne({ unionId: unionid });
        }
        if (!user && openid) {
            user = await User.findOne({ appOpenid: openid });
        }
        if (!user && phone) {
            user = await User.findOne({ phone });
        }
    }

    // 3. 更新现有用户信息
    if (user) {
        let changed = false;
        if (openid && user.appOpenid !== openid) {
            user.appOpenid = openid;
            changed = true;
        }
        if (unionid && user.unionId !== unionid) {
            user.unionId = unionid;
            changed = true;
        }
        if (phone && user.phone !== phone) {
            user.phone = phone;
            changed = true;
        }
        if (changed) await user.save();
    }

    // 4. 创建新用户
    if (!user) {
      user = new User({
        username: `Mini_${Date.now()}`,
        appOpenid: openid,
        unionId: unionid,
        phone: phone || undefined,
        status: UserStatusEnum.ACTIVE,
        role: UserRoleEnum.USER
      });
      await user.save();
      logger.info(`[Wechat Mini Login] Created new user: ${user._id}`);
    }

    // 5. 生成 token
    const token = signToken(user);
    ctx.cookies.set(LOGIN_COOKIE_KEY, token, getLoginCookieOptions());

    sendResponse.success(ctx, { 
      token, 
      user,
      isPhone: !!user.phone,
      userId: user._id,
      username: user.username
    });
  } catch (error: any) {
    logger.error(`[Wechat Mini Login] Error details:`, error.message, error.stack);
    if (error.response) {
        logger.error(`[Wechat Mini Login] Axios response error:`, error.response.status, error.response.data);
    }
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 微信小程序一键登录 (仅获取 openid/unionid，不强制绑定手机号)
 */
export const wechatTemporaryLogin = async (ctx: Context) => {
  const { code } = ctx.request.body as any;

  if (!code) {
    ctx.body = { code: 400, msg: "Missing code parameter" };
    return;
  }

  try {
    const wxResponse = await axios.get(MINI_PROGRAM_CONFIG.loginUrl, {
      params: {
        appid: MINI_PROGRAM_CONFIG.appId,
        secret: MINI_PROGRAM_CONFIG.appSecret,
        js_code: code,
        grant_type: "authorization_code"
      },
      proxy: false
    });

    const { openid, session_key, unionid, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      logger.error(`[Wechat Mini Temporary Login] Wechat API error: ${errcode}, ${errmsg}`);
      ctx.body = { code: 500, msg: "Wechat API error", data: wxResponse.data };
      return;
    }

    // 查找或创建用户
    let user: IUser | null = null;
    if (unionid) {
      user = await User.findOne({ unionId: unionid });
    }
    if (!user && openid) {
      user = await User.findOne({ appOpenid: openid });
    }

    if (!user) {
      user = new User({
        username: `Mini_${Date.now()}`,
        appOpenid: openid,
        unionId: unionid,
        status: UserStatusEnum.ACTIVE,
        role: UserRoleEnum.USER
      });
      await user.save();
    }

    const token = signToken(user);
    ctx.cookies.set(LOGIN_COOKIE_KEY, token, getLoginCookieOptions());
    
    sendResponse.success(ctx, { 
      token, 
      user, 
      session_key,
      isPhone: !!user.phone,
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    logger.error(`[Wechat Mini Temporary Login] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 微信公众号网页登录二维码
 * 生成唯一的 state 并构造授权 URL
 */
export const getQrCode = async (ctx: Context) => {
  const state = createWechatState();
  const authorizeUrl = buildWechatAuthorizeUrl(state);

  // 将 state 存入 Redis，有效期 5 分钟
  await redis.set(
    buildWechatLoginStateRedisKey(state),
    "1",
    "EX",
    WECHAT_STATE_EXPIRE_SECONDS
  );

  sendResponse.success(ctx, {
    appId: MP_CONFIG.appId,
    redirectUri: authorizeUrl,
    state: state,
    qrcodeUrl: authorizeUrl
  });
};

/**
 * 检查微信登录状态（前端轮询）
 */
export const checkLoginStatus = async (ctx: Context) => {
  const { state } = ctx.query as any;

  if (!state) {
    ctx.body = { code: 400, msg: "Missing state parameter" };
    return;
  }

  try {
    const result = await redis.get(buildWechatLoginCodeRedisKey(state));

    if (!result) {
      ctx.body = { code: 202, msg: "Waiting for scan", data: null };
      return;
    }

    // 检查 state 是否已使用
    const isUsed = await redis.get(`${buildWechatLoginCodeRedisKey(state)}:used`);
    if (isUsed) {
      ctx.body = { code: 400, msg: "Login code already used" };
      return;
    }

    const loginData = JSON.parse(result);
    // 标记为已使用，不再物理删除以防轮询重试，但设置极短过期时间
    await redis.set(`${buildWechatLoginCodeRedisKey(state)}:used`, "1", "EX", 10);
    // await redis.del(buildWechatLoginCodeRedisKey(state)); // 暂时不删，让轮询完成

    ctx.body = loginData;
  } catch (error) {
    logger.error(`[Wechat Check Status] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 微信公众号网页登录回调
 * 1. 验证 state
 * 2. 通过 code 获取 access_token
 * 3. 获取用户信息
 * 4. 查找或创建用户
 * 5. 返回登录结果
 */
export const wechatCallback = async (ctx: Context) => {
  const { code, state } = ctx.query as any;

  if (!code || !state) {
    ctx.body = { code: 400, msg: "Missing code or state parameter" };
    return;
  }

  try {
    // 1. 验证 state
    const savedState = await redis.get(buildWechatLoginStateRedisKey(state));
    if (!savedState) {
      ctx.body = { code: 400, msg: "Invalid state or expired" };
      return;
    }

    // 2. 通过 code 获取 access_token 和 openid
    const tokenResponse = await axios.get(WECHAT_TOKEN_API_URL, {
      params: {
        appid: MP_CONFIG.appId,
        secret: MP_CONFIG.appSecret,
        code,
        grant_type: "authorization_code"
      },
      proxy: false
    });

    const { access_token, openid, unionid, errcode, errmsg } = tokenResponse.data;

    if (errcode) {
      logger.error(`[Wechat Callback] Token API error: ${errcode}, ${errmsg}`);
      ctx.body = { code: 500, msg: "Wechat API error", data: tokenResponse.data };
      return;
    }

    // 3. 获取用户信息
    const userInfoResponse = await axios.get(WECHAT_USER_INFO_API_URL, {
      params: {
        access_token,
        openid,
        lang: "zh_CN"
      },
      proxy: false
    });

    const { nickname, headimgurl } = userInfoResponse.data;

    // 4. 查找或创建用户
    let user: IUser | null = null;

    if (unionid) {
      user = await User.findOne({ unionId: unionid });
      if (user) {
        if (user.openid !== openid) {
          user.openid = openid;
          await user.save();
        }
      }
    }

    if (!user && openid) {
      user = await User.findOne({ openid });
      if (user && unionid) {
        user.unionId = unionid;
        await user.save();
      }
    }

    if (!user) {
      user = new User({
        username: nickname || `Wechat_${Date.now()}`,
        openid,
        unionId: unionid,
        nickname: nickname || undefined,
        avatar: headimgurl || undefined,
        status: UserStatusEnum.ACTIVE,
        role: UserRoleEnum.USER
      });
      await user.save();
    }

    // 5. 生成 token
    const token = signToken(user);

    // 6. 清理 Redis
    await redis.del(buildWechatLoginStateRedisKey(state));

    // 7. 将登录结果存入 Redis，供前端轮询获取
    await redis.set(
      buildWechatLoginCodeRedisKey(state),
      JSON.stringify({ code: 200, msg: "Login successful", data: { token, user } }),
      "EX",
      WECHAT_LOGIN_CODE_EXPIRE_SECONDS
    );

    // 8. 返回 HTML 提示
    ctx.type = 'html';
    ctx.body = createLoginSuccessHtml(token);

  } catch (error) {
    logger.error(`[Wechat Callback] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};
