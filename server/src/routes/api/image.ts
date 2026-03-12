import Router from "koa-router";
import { generateImage } from "@/controllers/image";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  router.post('/api/image/generate', authMiddleware, generateImage);
}
