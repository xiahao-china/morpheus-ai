import Router from "koa-router";
// 导入广场控制器函数
import { getSquareList, publishSquare, likeSquare } from "@/controllers/square";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 广场相关路由
 * 包含作品展示列表、发布作品、点赞作品
 */
export default (router: Router) => {
  // 获取广场作品列表（公开接口，无需登录）
  router.get('/api/square/list', getSquareList);
  // 发布作品到广场（需要登录）
  router.post('/api/square/publish', authMiddleware, publishSquare);
  // 点赞作品（需要登录）
  router.post('/api/square/:id/like', authMiddleware, likeSquare);
}