import { Context as KoaContext } from "koa";
type Context = KoaContext | any;
import GenerationQueue from "@/models/generationQueue";
import GenerationTask, { TaskStatusEnum, TaskPurposeEnum } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import { generationScheduler } from "@/services/generation-scheduler";
import { calculateDimensions } from "./const";
import { callLLMAPI } from "@/services/generation-scheduler/llmTool";
import { TaskChannelEnum } from "@/models/generationTask";

const logger = getLogger("GenerationController");

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
 * 优化提示词
 * 实际项目中应调用 LLM API 进行优化
 */
export const optimizePrompt = async (ctx: Context) => {
  const { prompt } = ctx.request.body as any;

  if (!prompt) {
    ctx.body = { code: 400, msg: "Prompt is required" };
    return;
  }

  try {
    // 构造优化提示词的系统指令和参数
    const systemInstruction = `作为一名Stable Diffusion/ComfyUI室内设计提示词专家，请将用户输入的简短描述优化并润色为高质量的英文提示词。
要求：
1. 提取用户意图并翻译为准确的英文。
2. 自动补充高质量相关的提示词（如：(Masterpiece, Best Quality, 8k, highly detailed, photorealistic)）。
3. 补充适当的室内设计光影、材质、氛围描述（如：cinematic lighting, ray tracing, architectural photography）。
4. 只返回最终的英文提示词字符串，不要返回任何其他解释性文字。`;

    const llmPrompt = `${systemInstruction}\n\n用户输入: ${prompt}\n\n优化后的提示词:`;

    const result = await callLLMAPI({ prompt: llmPrompt }, TaskChannelEnum.LLM);

    // 清理可能的两边引号或空格
    let optimizedPrompt = result.content.trim();
    if (optimizedPrompt.startsWith('"') && optimizedPrompt.endsWith('"')) {
      optimizedPrompt = optimizedPrompt.slice(1, -1);
    }

    ctx.body = {
      code: 200,
      data: {
        originalPrompt: prompt,
        optimizedPrompt: optimizedPrompt
      }
    };
  } catch (error: any) {
    logger.error("Error optimizing prompt:", error);
    ctx.body = { code: 500, msg: "Failed to optimize prompt", error: error.message };
  }
};

/**
 * 创建生成任务
 * 1. 接收生成参数（提示词、尺寸、模型等）
 * 2. 创建 GenerationTask 记录
 * 3. 加入 GenerationQueue 队列
 * 4. 触发调度器执行
 */
export const generateImage = async (ctx: Context) => {
  try {
    const {
      prompt,
      ratio,
      count = 1,
      base_images
    } = ctx.request.body as any;

    if (!prompt) {
      ctx.body = { code: 400, msg: "Prompt is required" };
      return;
    }

    const user = ctx.state.user as any;

    // 根据是否有底图决定使用 ComfyUI 还是第三方服务
    const hasBaseImages = base_images && Array.isArray(base_images) && base_images.length > 0;
    const purpose = hasBaseImages ? TaskPurposeEnum.IMG2IMG : TaskPurposeEnum.TXT2IMG;
    
    // 如果没有底图，根据比例计算宽高
    let width = 1024;
    let height = 1024;
    if (!hasBaseImages) {
        const dimensions = calculateDimensions(ratio);
        width = dimensions.width;
        height = dimensions.height;
    }

    // 准备参数
    const params = {
      prompt,
      ratio,
      width,
      height,
      count: Number(count),
      seed: Math.floor(Math.random() * 1000000000000000),
      bucket_name: BUCKET_NAME,
      filename_prefix: `Morpheus_${Date.now()}`,
      baseImages: base_images
    };

    // 创建 GenerationTask 记录
    const generationTask = new GenerationTask({
      userId: user.uid,
      status: TaskStatusEnum.PENDING,
      purpose: purpose,
      params: params,
      comfyui: {
        seed: params.seed
      },
      createdTime: new Date()
    });

    await generationTask.save();
    const taskId = generationTask._id.toString();

    // 加入队列
    const queueItem = new GenerationQueue({
      taskId: taskId,
      userId: user.uid,
      status: 'queued',
      priority: 0,
      progress: 0,
      createdAt: new Date()
    });

    await queueItem.save();

    logger.info(`Task ${taskId} created and queued for user ${user.uid} (Purpose: ${purpose})`);

    // 返回任务ID
    ctx.body = {
      code: 200,
      data: {
        taskId,
        status: 'queued',
        queueId: queueItem._id }
    };

    // 立即触发调度器检查队列
    generationScheduler.triggerCheck();

  } catch (error: any) {
    logger.error("Error creating generation task:", error);
    ctx.body = { code: 500, msg: "Failed to create generation task", error: error.message };
  }
};

/**
 * 建立SSE连接，获取任务实时状态
 */
export const getGenerationStatus = async (ctx: Context) => {
  const { taskId } = ctx.params;
  const sseId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (!taskId) {
    ctx.status = 400;
    ctx.body = { code: 400, msg: "Task ID is required" };
    return;
  }

  try {
    // 验证任务是否存在
    const task = await GenerationTask.findById(taskId);
    if (!task) {
      ctx.status = 404;
      ctx.body = { code: 404, msg: "Task not found" };
      return;
    }

    // 设置 SSE 响应头
    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    ctx.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // 创建 SSE 流
    const stream = sseService.addConnection(sseId);
    ctx.body = stream;

    // 更新队列中的 SSE ID
    if (task.status === TaskStatusEnum.PENDING || task.status === TaskStatusEnum.PROCESSING || task.status === TaskStatusEnum.INITIATED) {
        await GenerationQueue.findOneAndUpdate({ taskId }, { sseId });

        sseService.send(sseId, "status", {
            taskId,
            status: task.status,
            progress: 0
        });
    } else if (task.status === TaskStatusEnum.COMPLETED) {
        const result = await ImageGenInfo.findOne({ imageGenTaskId: taskId });
        sseService.send(sseId, "complete", {
            taskId,
            status: 'completed',
            progress: 100,
            imageUrl: result?.imageUrl,
            imageId: result?._id
        });
    } else if (task.status === TaskStatusEnum.FAILED) {
        sseService.send(sseId, "error", {
            taskId,
            status: 'failed',
            error: "Task failed"
        });
    }

  } catch (error: any) {
    logger.error("SSE Error:", error);
    ctx.status = 500;
  }
};

/**
 * 获取任务详情（包含生成的图片）
 */
export const getTaskDetail = async (ctx: Context) => {
  try {
    const { taskId } = ctx.params;

    if (!taskId) {
      ctx.body = { code: 400, msg: "Task ID is required" };
      return;
    }

    const task = await GenerationTask.findById(taskId);
    if (!task) {
      ctx.body = { code: 404, msg: "Task not found" };
      return;
    }

    let result: any = {
      taskId: task._id,
      status: task.status,
      createdTime: task.createdTime,
      startedTime: task.startedTime,
      completedTime: task.completedTime,
      progress: 0
    };

    // 获取队列进度
    if (task.status === TaskStatusEnum.PENDING || task.status === TaskStatusEnum.PROCESSING || task.status === TaskStatusEnum.INITIATED) {
      const queueItem = await GenerationQueue.findOne({ taskId });
      if (queueItem) {
        result.progress = queueItem.progress || 0;
      }
    } else if (task.status === TaskStatusEnum.COMPLETED) {
      result.progress = 100;
      const imageInfo = await ImageGenInfo.findOne({ imageGenTaskId: taskId });
      if (imageInfo) {
        result.imageUrl = imageInfo.imageUrl;
        result.imageId = imageInfo._id;
        result.width = imageInfo.width;
        result.height = imageInfo.height;
      }
      // 保留 images 数组以防新版前端使用
      const images = await ImageGenInfo.find({ imageGenTaskId: taskId });
      result.images = images;
    }

    ctx.body = {
      code: 200,
      data: result
    };
  } catch (error: any) {
    logger.error(`Error getting task detail for ${ctx.params.taskId}:`, error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};

/**
 * 获取用户的生成记录历史
 */
export const getGenerationHistory = async (ctx: Context) => {
  try {
    const user = ctx.state.user as any;
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;

    // 获取用户所有已完成的图片
    const images = await ImageGenInfo.find({ userId: user.uid })
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await ImageGenInfo.countDocuments({ userId: user.uid });

    ctx.body = {
      code: 200,
      data: {
        list: images,
        total,
        page,
        pageSize,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    };
  } catch (error: any) {
    logger.error(`Error getting history for user:`, error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};