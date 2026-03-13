import { Context } from "koa";
import ImageGenInfo from "@/models/imageGenInfo";

// 1. Feedback API
export const submitFeedback = async (ctx: Context) => {
  const { id } = ctx.params;
  const { action } = ctx.request.body as any; // 'like' | 'dislike' | 'cancel'
  const user = ctx.state.user as any;

  if (!id) {
    ctx.body = { code: 400, msg: "Image ID is required" };
    return;
  }

  try {
    const image = await ImageGenInfo.findById(id);
    if (!image) {
      ctx.body = { code: 404, msg: "Image not found" };
      return;
    }

    // Verify ownership if needed, or just allow any user to like (usually should match userId)
    if (image.userId && image.userId !== user._id.toString()) {
        // Optional: restrict feedback to owner
        // ctx.body = { code: 403, msg: "Permission denied" };
        // return;
    }

    if (action === 'like') {
      image.isLiked = true;
    } else if (action === 'dislike') {
      image.isLiked = false;
    } else if (action === 'cancel') {
      image.isLiked = undefined;
    } else {
      ctx.body = { code: 400, msg: "Invalid action" };
      return;
    }

    await image.save();
    ctx.body = { code: 200, msg: "Feedback submitted", data: { isLiked: image.isLiked } };

  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 2. Prompt Optimization API (Mock)
export const optimizePrompt = async (ctx: Context) => {
  const { prompt } = ctx.request.body as any;

  if (!prompt) {
    ctx.body = { code: 400, msg: "Prompt is required" };
    return;
  }

  // Mock AI optimization logic
  // In real scenario, call LLM API (OpenAI/Claude/etc.)
  const optimizedPrompt = `(Masterpiece, Best Quality, 8k), ${prompt}, highly detailed, cinematic lighting, photorealistic`;

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 500));

  ctx.body = {
    code: 200,
    data: {
      originalPrompt: prompt,
      optimizedPrompt: optimizedPrompt
    }
  };
};
