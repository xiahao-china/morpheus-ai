import { Context } from "koa";
import ImageGenInfo from "@/models/imageGenInfo";

/**
 * 提交图片反馈（点赞/点踩）
 * action: 'like' | 'dislike' | 'cancel'
 */
export const submitFeedback = async (ctx: Context) => {
  const { id } = ctx.params;
  const { action } = ctx.request.body as any;
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

    // 更新点赞状态
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

/**
 * 优化提示词（Mock 实现）
 * 实际项目中应调用 LLM API 进行优化
 */
export const optimizePrompt = async (ctx: Context) => {
  const { prompt } = ctx.request.body as any;

  if (!prompt) {
    ctx.body = { code: 400, msg: "Prompt is required" };
    return;
  }

  // 简单的优化逻辑
  const optimizedPrompt = `(Masterpiece, Best Quality, 8k), ${prompt}, highly detailed, cinematic lighting, photorealistic`;

  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  ctx.body = {
    code: 200,
    data: {
      originalPrompt: prompt,
      optimizedPrompt: optimizedPrompt
    }
  };
};