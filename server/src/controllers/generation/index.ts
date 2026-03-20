import GenerationQueue from "@/models/generationQueue";
import GenerationTask, { TaskPurposeEnum, TaskStatusEnum } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import FileResource from "@/models/fileResource";
import { BUCKET_NAME, minioClient } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import { generationScheduler } from "@/services/generation-scheduler";
import { callLLMAPI } from "@/services/generation-scheduler/llmTool";
import { TaskChannelEnum } from "@/models/generationTask";
import { sendResponse } from "@/utils/const";
import {
  buildOptimizePromptInput,
  buildTranslatePromptInput,
  buildFengShuiPromptInput,
  Context,
  createGenerationTaskRecord,
  createSseId,
  createTaskDetailBase,
  DEFAULT_GENERATION_PAGE,
  DEFAULT_GENERATION_PAGE_SIZE,
  generateFilenamePrefix,
  generateTaskSeed,
  getDimensionsByPurpose,
  getGeneratedTaskPurpose,
  isProcessingTaskStatus,
  logger,
  normalizeOptimizedPrompt,
  parseGenerationAction,
  parsePositiveInt
} from "./const";

interface IFengShuiRequestBody {
  imageId?: string;
  houseInfo?: string;
  residentProfile?: string;
  residentNeeds?: string;
}

/**
 * 提交图片反馈（点赞/点踩）
 * action: 'like' | 'dislike' | 'cancel'
 */
export const submitFeedback = async (ctx: Context) => {
  const { id } = ctx.params;
  const { action } = ctx.request.body as any;

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
    const feedbackValue = parseGenerationAction(action);
    if (feedbackValue === null) {
      ctx.body = { code: 400, msg: "Invalid action" };
      return;
    }
    image.isLiked = feedbackValue;

    await image.save();
    sendResponse.success(ctx, { isLiked: image.isLiked });

  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
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
    const llmPrompt = buildOptimizePromptInput(prompt);

    const result = await callLLMAPI({ prompt: llmPrompt }, TaskChannelEnum.LLM);

    const optimizedPrompt = normalizeOptimizedPrompt(result.content);

    sendResponse.success(ctx, {
      originalPrompt: prompt,
      optimizedPrompt: optimizedPrompt
    });
  } catch (error: any) {
    logger.error("Error optimizing prompt:", error);
    sendResponse.error(ctx, "Failed to optimize prompt");
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
    let translatedPrompt = prompt;
    try {
      const translateInput = buildTranslatePromptInput(prompt);
      const translationTask = createGenerationTaskRecord(
        user.uid,
        TaskPurposeEnum.TRANSLATION,
        { prompt: translateInput, width: 1, height: 1 }
      );
      const translated = await generationScheduler.executeSyncTask(translationTask);
      translatedPrompt = normalizeOptimizedPrompt(translated.content) || prompt;
    } catch (error: any) {
      logger.warn(`Translate prompt failed, fallback to original prompt: ${error?.message || error}`);
    }

    // 根据是否有底图决定使用 ComfyUI 还是第三方服务
    const purpose = getGeneratedTaskPurpose(base_images);
    const { width, height } = getDimensionsByPurpose(purpose, ratio);

    // 准备参数
    const params = {
      prompt,
      ratio,
      width,
      height,
      count: Number(count),
      seed: generateTaskSeed(),
      bucket_name: BUCKET_NAME,
      filename_prefix: generateFilenamePrefix(),
      baseImages: base_images
    };

    const generationTask = createGenerationTaskRecord(user.uid, purpose, params, translatedPrompt);

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
    sendResponse.success(ctx, {
      taskId,
      status: 'queued',
      queueId: queueItem._id
    });

    // 立即触发调度器检查队列
    generationScheduler.triggerCheck();

  } catch (error: any) {
    logger.error("Error creating generation task:", error);
    sendResponse.error(ctx, "Failed to create generation task");
  }
};

export const generateFengShui = async (ctx: Context) => {
  try {
    const {
      imageId,
      houseInfo,
      residentProfile,
      residentNeeds
    } = ctx.request.body as IFengShuiRequestBody;

    if (!imageId) {
      ctx.body = { code: 400, msg: "Image ID is required" };
      return;
    }

    const user = ctx.state.user as any;
    const imageResource = await FileResource.findById(imageId);
    if (!imageResource) {
      ctx.body = { code: 404, msg: "Image not found" };
      return;
    }

    const ownerIds = [user?.uid, user?._id].filter(Boolean).map((id: any) => String(id));
    if (imageResource.userId && ownerIds.length && !ownerIds.includes(String(imageResource.userId))) {
      ctx.body = { code: 403, msg: "Image access denied" };
      return;
    }

    const imageUrl = await minioClient.presignedGetObject(
      imageResource.bucket || BUCKET_NAME,
      imageResource.path,
      24 * 60 * 60
    );

    const llmPrompt = buildFengShuiPromptInput({
      houseInfo,
      residentProfile,
      residentNeeds
    });

    const params = {
      prompt: llmPrompt,
      ratio: "1:1",
      width: 1024,
      height: 1024,
      count: 1,
      seed: generateTaskSeed(),
      bucket_name: BUCKET_NAME,
      filename_prefix: generateFilenamePrefix(),
      baseImages: [imageUrl]
    };

    const generationTask = createGenerationTaskRecord(user.uid, TaskPurposeEnum.FENG_SHUI, params);

    await generationTask.save();
    const taskId = generationTask._id.toString();

    const queueItem = new GenerationQueue({
      taskId,
      userId: user.uid,
      status: 'queued',
      priority: 0,
      progress: 0,
      createdAt: new Date()
    });

    await queueItem.save();

    sendResponse.success(ctx, {
      taskId,
      status: 'queued',
      queueId: queueItem._id
    });

    generationScheduler.triggerCheck();
  } catch (error: any) {
    logger.error("Error creating feng shui task:", error);
    sendResponse.error(ctx, "Failed to create feng shui task");
  }
};

/**
 * 建立SSE连接，获取任务实时状态
 */
export const getGenerationStatus = async (ctx: Context) => {
  const { taskId } = ctx.params;
  const sseId = createSseId();

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
    if (isProcessingTaskStatus(task.status)) {
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

    let result: any = createTaskDetailBase(task);

    // 获取队列进度
    if (isProcessingTaskStatus(task.status)) {
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
      if (task.textGenText) {
        result.content = task.textGenText;
      }
    }

    sendResponse.success(ctx, result);
  } catch (error: any) {
    logger.error(`Error getting task detail for ${ctx.params.taskId}:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取用户的生成记录历史
 */
export const getGenerationHistory = async (ctx: Context) => {
  try {
    const user = ctx.state.user as any;
    const page = parsePositiveInt(ctx.query.page, DEFAULT_GENERATION_PAGE);
    const pageSize = parsePositiveInt(ctx.query.pageSize, DEFAULT_GENERATION_PAGE_SIZE);
    const skip = (page - 1) * pageSize;
    const queryPurpose = typeof ctx.query.purpose === "string" ? ctx.query.purpose : "";
    const purposeWhitelist = new Set<string>([
      TaskPurposeEnum.TXT2IMG,
      TaskPurposeEnum.IMG2IMG,
      TaskPurposeEnum.FENG_SHUI
    ]);
    const purposeFilterList = queryPurpose
      ? queryPurpose.split(",").map((item: string) => item.trim()).filter((item: string) => purposeWhitelist.has(item))
      : [TaskPurposeEnum.TXT2IMG, TaskPurposeEnum.IMG2IMG];

    const historyFilter = {
      userId: user.uid,
      status: TaskStatusEnum.COMPLETED,
      purpose: { $in: purposeFilterList.length ? purposeFilterList : [TaskPurposeEnum.TXT2IMG, TaskPurposeEnum.IMG2IMG] },
    };

    const tasks = await GenerationTask.find(historyFilter)
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await GenerationTask.countDocuments(historyFilter);

    const taskIds = tasks.map((task) => task._id.toString());
    const imageList = taskIds.length
      ? await ImageGenInfo.find({ imageGenTaskId: { $in: taskIds } }).sort({ createdTime: -1 })
      : [];

    const imageMap = imageList.reduce((map, image) => {
      const taskId = image.imageGenTaskId;
      if (!map[taskId]) {
        map[taskId] = [];
      }
      map[taskId].push({
        imageId: image._id.toString(),
        imageUrl: image.imageUrl,
        fileResourceId: image.fileResourceId,
        width: image.width,
        height: image.height,
        createdTime: image.createdTime,
      });
      return map;
    }, {} as Record<string, Array<{
      imageId: string;
      imageUrl: string;
      fileResourceId: string;
      width?: number;
      height?: number;
      createdTime: Date;
    }>>);

    const list = tasks.map((task) => {
      const taskId = task._id.toString();
      const images = imageMap[taskId] || [];
      const firstImage = images[0];
      const taskImageUrl = firstImage?.imageUrl || task.params?.baseImages?.[0] || "";
      return {
        _id: taskId,
        userId: task.userId,
        imageGenTaskId: taskId,
        prompt: task.params?.prompt || "",
        underImageUrl: task.params?.baseImages?.[0] || "",
        type: task.purpose,
        status: task.status,
        width: firstImage?.width || task.params?.width || 0,
        height: firstImage?.height || task.params?.height || 0,
        imageUrl: taskImageUrl,
        imageId: firstImage?.imageId || "",
        content: task.textGenText || "",
        createdTime: task.createdTime,
        completedTime: task.completedTime,
        images,
      };
    });

    sendResponse.success(ctx, {
      list,
      total,
      page,
      pageSize,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: any) {
    logger.error(`Error getting history for user:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};
