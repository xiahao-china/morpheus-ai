import Router from "koa-router";
// 导入生成控制器函数
import { submitFeedback, optimizePrompt } from "@/controllers/generation";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 作品反馈与提示词优化路由
 * 包含生成作品的反馈（点赞/点踩）和提示词优化
 */
export default (router: Router) => {
  // 提交作品反馈（点赞/点踩）（需要登录）
  router.post('/api/v1/generation/feedback/:id', authMiddleware, submitFeedback);

  // AI提示词优化（需要登录）
  router.post('/api/v1/generation/prompt/optimize', authMiddleware, optimizePrompt);
}