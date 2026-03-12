import Router from "koa-router";
import { getPointsBalance, getPointsHistory } from "@/controllers/points";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  // Get Points Balance
  router.get('/api/v1/points/balance', authMiddleware, getPointsBalance);

  // Get Points History
  router.get('/api/v1/points/history', authMiddleware, getPointsHistory);
}
