import { Context } from "koa";
import User, { IUser, UserRoleEnum, UserStatusEnum } from "@/models/user";
import { signToken } from "@/utils/token";
import redis from "@/lib/redis";
import { logger } from "@/lib/log4js";
import { MINI_PROGRAM_CONFIG, MP_CONFIG, REDIS_KEYS, SMS_CONFIG } from "@/config/index";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

// 绑定手机号 (Web端微信登录后绑定)
export const bindPhone = async (ctx: Context) => {
  const { phone, code, inviteCode } = ctx.request.body as any;
  const currentUser = ctx.state.user; // Assumes authMiddleware sets this

  if (!phone || !code) {
    ctx.body = { code: 400, msg: "Missing phone or code" };
    return;
  }

  try {
    // 1. 验证验证码
    const redisKey = `${REDIS_KEYS.SMS_LOGIN_CODE}${phone}`;
    const storedCode = await redis.get(redisKey);
    
    // For testing/mock
    const isMock = SMS_CONFIG.mockSend && code === '666666';
    
    if (!isMock && (!storedCode || storedCode !== code)) {
      ctx.body = { code: 400, msg: "Invalid verification code" };
      return;
    }
    
    // 删除验证码 (optional)
    if (!isMock) await redis.del(redisKey);

    // 2. 获取当前用户完整信息
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
             // 该手机号账号已经绑定了微信 -> 冲突
             ctx.body = { code: 400, msg: "Phone number already bound to another Wechat account" };
             return;
        }

        // 手机号账号存在但未绑定微信 -> 合并
        // 将当前微信账号的 openid/unionid 转移到 phoneUser
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
        if (inviteCode) user.inviteCode = inviteCode; // 简单处理邀请码
        await user.save();
        finalUser = user;
    }

    // 4. 生成新 Token (因为 ID 可能变了)
    const token = signToken(finalUser);

    ctx.body = {
        code: 200,
        msg: "Bind successful",
        data: { token, user: finalUser }
    };

  } catch (error) {
    logger.error(`[Wechat Bind Phone] Error:`, error);
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 微信小程序手机号一键登录
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

    // 2. 如果有 encryptedData 和 iv，解密获取手机号
    let phone = null;
    if (encryptedData && iv) {
      // 实际项目中应使用 session_key 解密 encryptedData
      // 这里简化处理，假设前端传递了 phoneNumber 或者暂时跳过
      phone = (ctx.request.body as any).phoneNumber || null;
    }

    // 3. 查找或创建用户 (使用 unionid 关联)
    let user: IUser | null = null;

    // 优先使用 unionid 查找
    if (unionid) {
      user = await User.findOne({ unionId: unionid });
      if (user) {
        // 如果找到了用户，更新 appOpenid (小程序 openid)
        if (user.appOpenid !== openid) {
          user.appOpenid = openid;
          await user.save();
        }
      }
    }

    // 如果没找到，尝试使用 appOpenid 查找
    if (!user && openid) {
      user = await User.findOne({ appOpenid: openid });
      if (user && unionid) {
        // 如果找到了用户，更新 unionId
        user.unionId = unionid;
        await user.save();
      }
    }

    // 如果还是没找到，尝试使用手机号查找
    if (!user && phone) {
      user = await User.findOne({ phone });
      if (user) {
        // 绑定微信信息
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

    ctx.body = {
      code: 200,
      data: { token, user }
    };
  } catch (error) {
    logger.error(`[Wechat Mini Login] Error:`, error);
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 获取微信公众号网页登录二维码
export const getQrCode = async (ctx: Context) => {
  // 生成唯一的 state
  const state = uuidv4().replace(/-/g, '');
  const redirectUri = encodeURIComponent(MP_CONFIG.redirectUri);

  // 构造微信授权地址
  const authorizeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${MP_CONFIG.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${MP_CONFIG.scope}&state=${state}#wechat_redirect`;

  // 将 state 存入 Redis，用于回调验证（有效期5分钟）
  // 这里的 key 需要与回调时检查的一致
  await redis.set(
    `${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`,
    "1", // 值为简单标记，表示 state 有效
    "EX",
    300
  );

  ctx.body = {
    code: 200,
    data: {
      appId: MP_CONFIG.appId,
      redirectUri: authorizeUrl, // 重定向地址
      state: state,
      qrcodeUrl: authorizeUrl // 前端可以直接跳转此 URL
    }
  };
};

// 检查微信登录状态（前端轮询）
export const checkLoginStatus = async (ctx: Context) => {
  const { state } = ctx.query as any;

  if (!state) {
    ctx.body = { code: 400, msg: "Missing state parameter" };
    return;
  }

  try {
    const result = await redis.get(`${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`);

    if (!result) {
      // 还没有登录结果
      ctx.body = { code: 202, msg: "Waiting for scan", data: null };
      return;
    }

    const loginData = JSON.parse(result);
    // 获取后删除，保证一次性 (或者保留一小段时间?) 
    // 通常轮询到成功后，前端会跳转，这里删除是安全的
    await redis.del(`${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`);

    ctx.body = loginData;
  } catch (error) {
    logger.error(`[Wechat Check Status] Error:`, error);
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 微信公众号网页登录回调
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

    // 4. 查找或创建用户 (使用 unionid 关联)
    let user: IUser | null = null;

    // 优先使用 unionid 查找
    if (unionid) {
      user = await User.findOne({ unionId: unionid });
      if (user) {
        // 更新 openid (公众号 openid)
        if (user.openid !== openid) {
          user.openid = openid;
          await user.save();
        }
      }
    }

    // 如果没找到，尝试使用 openid 查找
    if (!user && openid) {
      user = await User.findOne({ openid });
      if (user && unionid) {
        user.unionId = unionid;
        await user.save();
      }
    }

    // 创建新用户
    if (!user) {
      user = new User({
        username: nickname || `Wechat_${Date.now()}`,
        openid, // 公众号 openid
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

    // 6. 清理 Redis 中的 state 标记
    await redis.del(`${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`);

    // 7. 将登录结果存入 Redis，供前端轮询获取
    await redis.set(
      `${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`,
      JSON.stringify({ code: 200, msg: "Login successful", data: { token, user } }),
      "EX",
      300
    );

    // 8. 返回简单的 HTML 提示关闭或重定向
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
            // 尝试通知父窗口（如果是弹窗）
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
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};