import Router from "koa-router";
// 导入用户控制器函数
import { login, sendVerifyCode, getUserInfo, updateUserInfo } from "@/controllers/user";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 用户相关路由
 * 包含登录、验证码、用户信息获取与更新
 */
export default (router: Router) => {
  // 用户登录（手机号/验证码登录）
  router.post('/api/user/login', login);
  // 发送登录验证码
  router.post('/api/user/send-code', sendVerifyCode);
  // 获取当前用户信息（需要登录）
  router.get('/api/user/info', authMiddleware, getUserInfo);
  // 更新用户信息（需要登录）
  router.put('/api/user/info', authMiddleware, updateUserInfo);
}