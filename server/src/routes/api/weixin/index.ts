import Router from "koa-router";
// 导入微信登录控制器函数
import { miniProgramLogin, getQrCode, wechatCallback, checkLoginStatus, bindPhone } from "@/controllers/weixin";
import { authMiddleware } from "@/middleware/auth";

/**
 * 微信登录相关路由
 * 包含小程序登录、公众号网页登录二维码、扫码回调
 */
export default (router: Router) => {
  // 微信小程序一键登录（手机号绑定）
  router.post('/api/users/wechat/mini/bind-phone', miniProgramLogin);

  // 微信网页登录绑定手机号
  router.post('/api/users/wechat/bind-phone', authMiddleware, bindPhone);

  // 获取微信公众号网页登录二维码
  router.get('/api/users/wechat/login/qrcode', getQrCode);

  // 微信公众号网页登录回调
  router.get('/api/users/wechat/callback', wechatCallback);

  // 检查微信登录状态（前端轮询）
  router.get('/api/users/wechat/check-status', checkLoginStatus);
};
