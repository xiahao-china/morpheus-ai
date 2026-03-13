import { Context } from "koa";
import GenerationQueue from "@/models/generationQueue";
import ImageGenTask, { TaskStatusEnum, ImageActionModeEnum, TaskProviderEnum } from "@/models/imageGenTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import { generationScheduler } from "@/services/generation-scheduler";

const logger = getLogger("ImageController");

/**
 * 创建图像生成任务
 * 1. 接收生成参数（提示词、尺寸、模型等）
 * 2. 创建 ImageGenTask 记录
 * 3. 加入 GenerationQueue 队列
 * 4. 触发调度器执行
 */
export const generateImage = async (ctx: Context) => {
  try {
    const {
      prompt,
      negative_prompt,
      width = 1024,
      height = 1024,
      count = 1,
      seed,
      model,
      base_images
    } = ctx.request.body as any;

    if (!prompt) {
      ctx.body = { code: 400, msg: "Prompt is required" };
      return;
    }

    const user = ctx.state.user as any;

    // 根据是否有底图决定使用 ComfyUI 还是第三方服务
    const hasBaseImages = base_images && Array.isArray(base_images) && base_images.length > 0;
    const provider = hasBaseImages ? TaskProviderEnum.THIRD_PARTY : TaskProviderEnum.COMFYUI;

    // 准备参数
    const params = {
      prompt,
      negative_prompt: negative_prompt || "people,Deformed, unrealistic, bad quality, grainy, noisy, plastic, hazy, low contrast",
      width: Number(width),
      height: Number(height),
      count: Number(count),
      seed: seed || Math.floor(Math.random() * 1000000000000000),
      model: model || "SDXL/3-室内设计大模型（老陈）_V2.0.safetensors",
      bucket_name: BUCKET_NAME,
      filename_prefix: `Morpheus_${Date.now()}`,
      baseImages: base_images
    };

    // 创建 ImageGenTask 记录
    const imageGenTask = new ImageGenTask({
      userId: user.uid,
      status: TaskStatusEnum.PENDING,
      type: ImageActionModeEnum.DRAWING,
      provider: provider,
      params: params,
      comfyui: {
        seed: params.seed
      },
      createdTime: new Date()
    });

    await imageGenTask.save();
    const taskId = imageGenTask._id.toString();

    // 加入队列
    const queueItem = new GenerationQueue({
      taskId: taskId,
      userId: user.uid,
      status: 'queued',
      provider: provider,
      priority: 0,
      progress: 0,
      payload: params,
      createdAt: new Date()
    });

    await queueItem.save();

    logger.info(`Task ${taskId} created and queued for user ${user.uid} (Provider: ${provider})`);

    // 返回任务ID
    ctx.body = {
      code: 200,
      data: {
        taskId,
        status: 'queued',
        queueId: queueItem._id }
    };

    // 触发调度器
    generationScheduler.triggerCheck();

  } catch (error: any) {
    logger.error("Generate image error:", error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};

/**
 * 获取任务状态（SSE 实时推送）
 * 通过 SSE 实时推送任务进度和结果
 */
export const getGenerationStatus = async (ctx: Context) => {
  const { taskId } = ctx.params;
  const sseId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const task = await ImageGenTask.findById(taskId);
    if (!task) {
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
 * 获取任务详情（非 SSE）
 * 返回任务状态和结果
 */
export const getTaskDetail = async (ctx: Context) => {
  const { taskId } = ctx.params;

  try {
    const task = await ImageGenTask.findById(taskId);
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
    if (task.status === TaskStatusEnum.PENDING || task.status === TaskStatusEnum.PROCESSING) {
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
    }

    ctx.body = {
      code: 200,
      data: result
    };
  } catch (error: any) {
    logger.error("Get task detail error:", error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};

/**
 * 获取生图历史记录（分页）
 */
export const getGenerationHistory = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    const { page = 1, pageSize = 20 } = ctx.query;

    const filter = { userId: user._id };

    const list = await ImageGenInfo.find(filter)
      .sort({ createdTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    const total = await ImageGenInfo.countDocuments(filter);

    ctx.body = {
      code: 200,
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    };
  } catch (error: any) {
    logger.error("Get generation history error:", error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};