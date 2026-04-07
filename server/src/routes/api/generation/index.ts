import Router from "koa-router";
// 导入生成控制器函数
import {
  submitFeedback,
  optimizePrompt,
  generateImage,
  generateFengShui,
  getGenerationStatus,
  getTaskDetail,
  getGenerationHistory,
  likeImage,
  collectImage,
  uncollectImage,
  getMyImageCollections
} from "@/controllers/generation";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 任务生成相关路由（包含图片、文本生成、反馈与优化）
 */
export default (router: Router) => {
  // 提交作品反馈（仅点赞/取消点赞）（需要登录）
  router.post('/api/generation/feedback/:id', authMiddleware, submitFeedback);

  // AI提示词优化（需要登录）
  router.post('/api/generation/prompt/optimize', authMiddleware, optimizePrompt);

  // AI任务生成接口（需要登录）- 兼容旧的图片生成路径
  router.post('/api/image/generate', authMiddleware, generateImage);

  // AI风水分析任务接口（需要登录）
  router.post('/api/generation/fengshui', authMiddleware, generateFengShui);

  // 查询任务状态接口 (SSE) - 兼容旧路径
  router.get('/api/image/status/:taskId', getGenerationStatus);

  // 查询任务详情接口 (JSON, 包含结果URL) - 兼容旧路径
  router.get('/api/image/detail/:taskId', getTaskDetail);

  // 获取生成记录列表 (分页) - 兼容旧路径
  router.get('/api/image/history', authMiddleware, getGenerationHistory);

  // 获取生成记录列表 (分页) - 新路径
  router.get('/api/images/records', authMiddleware, getGenerationHistory);
  router.get('/api/images/generates', authMiddleware, getGenerationHistory);

  // 点赞/取消点赞（需要登录）
  router.post('/api/image/:id/like', authMiddleware, likeImage);

  // 收藏图片（需要登录）
  router.post('/api/image/:id/collect', authMiddleware, collectImage);

  // 取消收藏图片（需要登录）
  router.delete('/api/image/:id/collect', authMiddleware, uncollectImage);

  // 查询我的收藏图片（分页，需要登录）
  router.get('/api/image/collections', authMiddleware, getMyImageCollections);
}
