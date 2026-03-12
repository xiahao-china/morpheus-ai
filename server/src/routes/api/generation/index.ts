import Router from "koa-router";
import { submitFeedback, optimizePrompt } from "@/controllers/generation";
import { authMiddleware } from "@/middleware/auth";

export default (router: Router) => {
  // Feedback (Like/Dislike)
  router.post('/api/v1/generation/feedback/:id', authMiddleware, submitFeedback);

  // Prompt Optimization
  router.post('/api/v1/generation/prompt/optimize', authMiddleware, optimizePrompt);
}
