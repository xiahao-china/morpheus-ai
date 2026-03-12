import Router from "koa-router";
import { login, sendVerifyCode, getUserInfo, updateUserInfo } from "@/controllers/user";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  router.post('/api/user/login', login);
  router.post('/api/user/send-code', sendVerifyCode);
  router.get('/api/user/info', authMiddleware, getUserInfo);
  router.put('/api/user/info', authMiddleware, updateUserInfo);
}
