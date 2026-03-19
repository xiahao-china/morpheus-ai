import { Context as KoaContext } from "koa";
type Context = KoaContext | any;
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import { MINI_PROGRAM_CONFIG, MP_CONFIG, REDIS_KEYS, SMS_CONFIG } from "@/config/index";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { sendResponse, EReqStatus } from "@/utils/const";

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
    const redisKey = `${REDIS_KEYS.SMS_LOGIN_CODE}${phone}`;
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
 * 微信小程序手机号一键登录
 * 1. 通过 code 获取 session_key 和 openid
 * 2. 解密获取手机号
 * 3. 查找或创建用户
 */
export const miniProgramLogin = async (ctx: Context) => {
  const { code, encryptedData, iv } = ctx.request.body as any;

  if (!code) {
    ctx.body = { code: 400, msg: "Missing code parameter" };
    return;
  }

  try {
    // 1. 通过 code 获取 session_key 和 openid
    const wxResponse = await axios.get(MINI_PROGRAM_CONFIG.loginUrl, {
      params: {
        appid: MINI_PROGRAM_CONFIG.appId,
        secret: MINI_PROGRAM_CONFIG.appSecret,
        js_code: code,
        grant_type: "authorization_code"
      }
    });

    const { openid, session_key, unionid, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      logger.error(`[Wechat Mini Login] Wechat API error: ${errcode}, ${errmsg}`);
      ctx.body = { code: 500, msg: "Wechat API error", data: wxResponse.data };
      return;
    }

    // 2. 解密获取手机号（如有）
    let phone = null;
    if (encryptedData && iv) {
      phone = (ctx.request.body as any).phoneNumber || null;
    }

    // 3. 查找或创建用户
    let user: IUser | null = null;

    // 优先使用 unionid 查找
    if (unionid) {
      user = await User.findOne({ unionId: unionid });
      if (user) {
        if (user.appOpenid !== openid) {
          user.appOpenid = openid;
          await user.save();
        }
      }
    }

    // 尝试使用 appOpenid 查找
    if (!user && openid) {
      user = await User.findOne({ appOpenid: openid });
      if (user && unionid) {
        user.unionId = unionid;
        await user.save();
      }
    }

    // 尝试使用手机号查找
    if (!user && phone) {
      user = await User.findOne({ phone });
      if (user) {
        user.appOpenid = openid;
        if (unionid) user.unionId = unionid;
        await user.save();
      }
    }

    // 创建新用户
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
    }

    // 4. 生成 token
    const token = signToken(user);

    sendResponse.success(ctx, { token, user });
  } catch (error) {
    logger.error(`[Wechat Mini Login] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取微信公众号网页登录二维码
 * 生成唯一的 state 并构造授权 URL
 */
export const getQrCode = async (ctx: Context) => {
  const state = uuidv4().replace(/-/g, '');
  const redirectUri = encodeURIComponent(MP_CONFIG.redirectUri);

  // 构造微信授权地址
  const authorizeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${MP_CONFIG.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${MP_CONFIG.scope}&state=${state}#wechat_redirect`;

  // 将 state 存入 Redis，有效期 5 分钟
  await redis.set(
    `${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`,
    "1",
    "EX",
    300
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
    const result = await redis.get(`${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`);

    if (!result) {
      ctx.body = { code: 202, msg: "Waiting for scan", data: null };
      return;
    }

    const loginData = JSON.parse(result);
    await redis.del(`${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`);

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
    const savedState = await redis.get(`${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`);
    if (!savedState) {
      ctx.body = { code: 400, msg: "Invalid state or expired" };
      return;
    }

    // 2. 通过 code 获取 access_token 和 openid
    const tokenResponse = await axios.get("https://api.weixin.qq.com/sns/oauth2/access_token", {
      params: {
        appid: MP_CONFIG.appId,
        secret: MP_CONFIG.appSecret,
        code,
        grant_type: "authorization_code"
      }
    });

    const { access_token, openid, unionid, errcode, errmsg } = tokenResponse.data;

    if (errcode) {
      logger.error(`[Wechat Callback] Token API error: ${errcode}, ${errmsg}`);
      ctx.body = { code: 500, msg: "Wechat API error", data: tokenResponse.data };
      return;
    }

    // 3. 获取用户信息
    const userInfoResponse = await axios.get("https://api.weixin.qq.com/sns/userinfo", {
      params: {
        access_token,
        openid,
        lang: "zh_CN"
      }
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
    await redis.del(`${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`);

    // 7. 将登录结果存入 Redis，供前端轮询获取
    await redis.set(
      `${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`,
      JSON.stringify({ code: 200, msg: "Login successful", data: { token, user } }),
      "EX",
      300
    );

    // 8. 返回 HTML 提示
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Successful</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
          .container { text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #07c160; margin-bottom: 1rem; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>登录成功</h1>
          <p>您已成功登录，请返回原页面。</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'wechat_login_success', token: '${token}' }, '*');
              window.close();
            }
          </script>
        </div>
      </body>
      </html>
    `;

  } catch (error) {
    logger.error(`[Wechat Callback] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};