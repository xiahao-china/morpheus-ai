import Router from "koa-router";
import { getSquareList, publishSquare, likeSquare } from "@/controllers/square";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  router.get('/api/square/list', getSquareList);
  router.post('/api/square/publish', authMiddleware, publishSquare);
  router.post('/api/square/:id/like', authMiddleware, likeSquare);
}
