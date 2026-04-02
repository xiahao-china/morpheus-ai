/**
 * 微信配置
 * 参照 ai-design-backend-main 配置
 */

// 微信 API 基础地址
export const WECHAT_BASE_URL = "https://api.weixin.qq.com";

// 微信公众号/网页登录配置 (网站应用 - 用于扫码登录)
export const MP_CONFIG = {
  baseUrl: WECHAT_BASE_URL,
  // 对应 ai-design-backend 中的 wechat.appid
  appId: "wxc1187a83683691f4",
  // 对应 ai-design-backend 中的 wechat.appsecret
  appSecret: "bf660050482d5acc1b4faf9b2bf2dbe7",
  // 对应 ai-design-backend 中的 wechat.redirect-uri
  redirectUri: "https://wx.tuiqiao.art/ai_design_poxy/wxLoginProxy.html",
  scope: "snsapi_login",
};

// 微信小程序配置
export const MINI_PROGRAM_CONFIG = {
  baseUrl: WECHAT_BASE_URL,
  loginUrl: `${WECHAT_BASE_URL}/sns/jscode2session`,
  // 对应 ai-design-backend 中的 wechat.appidkey
  appId: "wx9dff8a1fc0fbd92f",
  // 对应 ai-design-backend 中的 wechat.appidsecretkey
    appSecret: "3fa54a8cdd3924bbd93097b4483494cc",
};

// 微信服务号配置（用于 JSAPI/H5）
export const FWH_CONFIG = {
  baseUrl: WECHAT_BASE_URL,
  // 对应 ai-design-backend 中的 wechat.appid_fwh
  appId: "wx566cea7724c10aff",
  // 对应 ai-design-backend 中的 wechat.appidsecret_fwh
  appSecret: "eae3fbd42e9bbd80b1f884442a86829f",
};

// 导出统一配置对象
export const WEIXIN_CONFIG = {
  baseUrl: WECHAT_BASE_URL,
  mp: MP_CONFIG,
  miniProgram: MINI_PROGRAM_CONFIG,
  fwh: FWH_CONFIG,
};
