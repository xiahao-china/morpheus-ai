import { Context as KoaContext } from "koa";
import { v4 as uuidv4 } from "uuid";
import { MP_CONFIG, REDIS_KEYS } from "@/config/index";

export type Context = KoaContext | any;

export const WECHAT_STATE_EXPIRE_SECONDS = 300;
export const WECHAT_LOGIN_CODE_EXPIRE_SECONDS = 300;
export const WECHAT_TOKEN_API_URL = "https://api.weixin.qq.com/sns/oauth2/access_token";
export const WECHAT_USER_INFO_API_URL = "https://api.weixin.qq.com/sns/userinfo";

export const buildSmsLoginRedisKey = (phone: string) => `${REDIS_KEYS.SMS_LOGIN_CODE}${phone}`;
export const buildWechatLoginStateRedisKey = (state: string) => `${REDIS_KEYS.WECHAT_LOGIN_STATE}${state}`;
export const buildWechatLoginCodeRedisKey = (state: string) => `${REDIS_KEYS.WECHAT_LOGIN_CODE}${state}`;

export const createWechatState = () => uuidv4().replace(/-/g, "");

export const buildWechatAuthorizeUrl = (state: string) => {
  const redirectUri = encodeURIComponent(MP_CONFIG.redirectUri);
  return `https://open.weixin.qq.com/connect/qrconnect?appid=${MP_CONFIG.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${MP_CONFIG.scope}&state=${state}#wechat_redirect`;
};

export const createLoginSuccessHtml = (token: string) => `
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
