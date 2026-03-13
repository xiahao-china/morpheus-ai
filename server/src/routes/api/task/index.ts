import Router from "koa-router";
// 导入任务控制器函数
import { getTaskList, completeTask } from "@/controllers/task";
// 导入认证中间件
import { authMiddleware } from "@/middleware/auth";

/**
 * 任务相关路由
 * 包含获取任务列表、完成每日任务
 */
export default (router: Router) => {
  // 获取当前用户的任务列表（需要登录）
  router.get('/api/task/list', authMiddleware, getTaskList);
  // 完成指定任务（需要登录）
  router.post('/api/task/complete', authMiddleware, completeTask);
}