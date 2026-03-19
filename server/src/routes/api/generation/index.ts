import Router from "koa-router";
// 导入生成控制器函数
import { submitFeedback, optimizePrompt, generateImage, getGenerationStatus, getTaskDetail, getGenerationHistory } from "@/controllers/generation";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 任务生成相关路由（包含图片、文本生成、反馈与优化）
 */
export default (router: Router) => {
  // 提交作品反馈（点赞/点踩）（需要登录）
  router.post('/api/v1/generation/feedback/:id', authMiddleware, submitFeedback);

  // AI提示词优化（需要登录）
  router.post('/api/v1/generation/prompt/optimize', authMiddleware, optimizePrompt);

  // AI任务生成接口（需要登录）- 兼容旧的图片生成路径
  router.post('/api/image/generate', authMiddleware, generateImage);

  // 查询任务状态接口 (SSE) - 兼容旧路径
  router.get('/api/image/status/:taskId', getGenerationStatus);

  // 查询任务详情接口 (JSON, 包含结果URL) - 兼容旧路径
  router.get('/api/image/detail/:taskId', getTaskDetail);

  // 获取生成记录列表 (分页) - 兼容旧路径
  router.get('/api/image/history', authMiddleware, getGenerationHistory);
}