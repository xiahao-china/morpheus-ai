import Router from "koa-router";
import { getTasks, claimReward } from "@/controllers/task-reward";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  // Get Task List
  router.get('/api/v1/tasks', authMiddleware, getTasks);

  // Claim Task Reward
  router.post('/api/v1/tasks/claim', authMiddleware, claimReward);
}
