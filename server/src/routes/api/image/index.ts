import Router from "koa-router";
// 导入图片生成控制器
import { generateImage, getGenerationStatus, getTaskDetail, getGenerationHistory } from "@/controllers/image";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 图片生成相关路由
 * 负责AI图片生成相关接口
 */
export default (router: Router) => {
  // AI图片生成接口（需要登录）
  router.post('/api/image/generate', authMiddleware, generateImage);

  // 查询任务状态接口 (SSE)
  router.get('/api/image/status/:taskId', getGenerationStatus);

  // 查询任务详情接口 (JSON, 包含结果URL)
  router.get('/api/image/detail/:taskId', getTaskDetail);

  // 获取生图记录列表 (分页)
  router.get('/api/image/history', authMiddleware, getGenerationHistory);
}
