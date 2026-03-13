import { Context } from "koa";
import GenerationQueue from "@/models/generationQueue";
import ImageGenTask, { TaskStatusEnum, ImageActionModeEnum, TaskProviderEnum } from "@/models/imageGenTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import { generationScheduler } from "@/services/generation-scheduler";

const logger = getLogger("ImageController");

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

    // Determine provider based on base_images presence
    const hasBaseImages = base_images && Array.isArray(base_images) && base_images.length > 0;
    const provider = hasBaseImages ? TaskProviderEnum.THIRD_PARTY : TaskProviderEnum.COMFYUI;

    // 1. 准备参数
    const params = {
      prompt,
      negative_prompt: negative_prompt || "people,Deformed, unrealistic, bad quality, grainy, noisy, plastic, hazy, low contrast",
      width: Number(width),
      height: Number(height),
      count: Number(count),
      seed: seed || Math.floor(Math.random() * 1000000000000000),
      model: model || "SDXL/3-室内设计大模型（老陈）_V2.0.safetensors", // 默认模型
      bucket_name: BUCKET_NAME, // 传递bucket名称以防 SaveImageS3 需要
      filename_prefix: `Morpheus_${Date.now()}`,
      baseImages: base_images
    };

    // 2. 创建 ImageGenTask 记录 (主任务表)
    const imageGenTask = new ImageGenTask({
      userId: user.uid,
      status: TaskStatusEnum.PENDING,
      type: ImageActionModeEnum.DRAWING, // 默认为绘图模式，可根据参数调整
      provider: provider,
      params: params,
      comfyui: {
        seed: params.seed
      },
      createdTime: new Date()
    });
    
    await imageGenTask.save();
    const taskId = imageGenTask._id.toString();

    // 3. 将任务加入 GenerationQueue (处理队列)
    const queueItem = new GenerationQueue({
      taskId: taskId, // 使用 ImageGenTask 的 ID 作为 taskId
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

    // 4. 返回任务ID
    ctx.body = { 
      code: 200, 
      data: { 
        taskId,
        status: 'queued',
        queueId: queueItem._id
      } 
    };

    // 5. 立即触发调度器检查队列
    generationScheduler.triggerCheck();

  } catch (error: any) {
    logger.error("Generate image error:", error);
    ctx.body = { code: 500, msg: "Internal server error", error: error.message };
  }
};

/**
 * 获取任务状态 (SSE)
 */
export const getGenerationStatus = async (ctx: Context) => {
  const { taskId } = ctx.params;
  const sseId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 验证任务是否存在
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
      "Access-Control-Allow-Origin": "*", // 根据实际安全需求调整
    });

    // 创建 SSE 流
    const stream = sseService.addConnection(sseId);
    ctx.body = stream;

    // 更新队列中的 SSE ID，以便调度器推送更新
    // 注意：如果任务已经完成（不在队列中），我们这里可能无法更新队列。
    // 但如果任务已完成，我们应该直接通过SSE发送完成状态。
    
    if (task.status === TaskStatusEnum.PENDING || task.status === TaskStatusEnum.PROCESSING || task.status === TaskStatusEnum.INITIATED) {
        // 更新 GenerationQueue 中的 sseId
        await GenerationQueue.findOneAndUpdate({ taskId }, { sseId });
        
        // 发送初始状态
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
        // 既然已完成，可以在发送后关闭流（或者由客户端关闭）
        // stream.end(); 
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
 * 获取任务详情（非SSE）
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

    // 如果任务在队列中，尝试获取进度
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
    } else if (task.status === TaskStatusEnum.FAILED) {
      // 尝试从队列记录或者其他地方获取错误信息
      // 这里简化处理，假设任务对象本身没有存错误信息（虽然应该存）
      // 我们可以从 GenerationQueue 的 failed 记录中找（如果没被删）
      // 或者直接返回 failed
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
 * 获取生图记录列表 (分页)
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

