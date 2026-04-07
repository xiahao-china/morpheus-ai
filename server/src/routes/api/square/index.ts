import Router from "koa-router";
// 导入广场控制器函数
import { getSquareList, getSquareDetail, publishSquare, likeSquare, deleteSquare } from "@/controllers/square";
// 导入认证中间件
import { authMiddleware, optionalAuthMiddleware } from "@/middleware/auth";

/**
 * 广场相关路由
 * 包含作品展示列表、发布作品、点赞作品、删除作品
 */
export default (router: Router) => {
  // 获取广场作品列表（公开接口，携带 Token 则显示收藏状态）
  router.get('/api/square/list', optionalAuthMiddleware, getSquareList);
  // 获取广场详情（公开接口，携带 Token 则显示收藏状态）
  router.get('/api/square/:id', optionalAuthMiddleware, getSquareDetail);
  // 发布作品到广场（需要登录）
  router.post('/api/square/publish', authMiddleware, publishSquare);
  // 删除作品（需要登录）
  router.delete('/api/square/:id', authMiddleware, deleteSquare);
  // 点赞作品（需要登录）
  router.post('/api/square/:id/like', authMiddleware, likeSquare);
}
