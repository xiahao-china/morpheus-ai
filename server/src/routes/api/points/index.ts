import Router from "koa-router";
// 导入积分控制器函数
import { getPointsBalance, getPointsHistory } from "@/controllers/points";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 积分相关路由
 * 包含获取积分余额、获取积分历史记录
 */
export default (router: Router) => {
  // 获取当前用户积分余额（需要登录）
  router.get('/api/points/balance', authMiddleware, getPointsBalance);

  // 获取积分变动历史记录（需要登录）
  router.get('/api/points/history', authMiddleware, getPointsHistory);
}