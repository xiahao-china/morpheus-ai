import Router from "koa-router";
import { getTaskList, completeTask } from "@/controllers/task";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  router.get('/api/task/list', authMiddleware, getTaskList);
  router.post('/api/task/complete', authMiddleware, completeTask);
}
