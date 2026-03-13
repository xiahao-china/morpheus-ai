import Router from "koa-router";
// 导入任务奖励控制器函数
import { getTasks, claimReward, performTask } from "@/controllers/task-reward";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 任务奖励相关路由
 * 包含获取可领取的任务列表、领取任务奖励
 */
export default (router: Router) => {
  // 获取任务列表（需要登录）
  router.get('/api/v1/tasks', authMiddleware, getTasks);

  // 领取任务奖励（需要登录）
  router.post('/api/v1/tasks/claim', authMiddleware, claimReward);

  // 手动触发任务（例如：签到）
  router.post('/api/v1/tasks/perform', authMiddleware, performTask);
}