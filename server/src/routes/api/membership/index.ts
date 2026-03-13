import Router from "koa-router";
// 导入会员控制器函数
import { getPackages, createOrder } from "@/controllers/membership";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 会员套餐相关路由
 * 包含获取会员套餐列表、创建会员订单
 */
export default (router: Router) => {
  // 获取会员套餐列表（公开接口）
  router.get('/api/v1/membership/packages', getPackages);

  // 创建会员订单（需要登录）
  router.post('/api/v1/membership/order', authMiddleware, createOrder);
}