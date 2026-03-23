import GenerationQueue from "@/models/generationQueue";
import GenerationTask, { TaskPurposeEnum, TaskStatusEnum } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import UserImageCollect from "@/models/userImageCollect";
import FileResource from "@/models/fileResource";
import { BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import { generationScheduler } from "@/services/generation-scheduler";
import { callLLMAPI } from "@/services/generation-scheduler/llmTool";
import { TaskChannelEnum } from "@/models/generationTask";
import { sendResponse } from "@/utils/const";
import {
  buildOptimizePromptInput,
  buildTranslatePromptInput,
  appendInspirationPromptSuffix,
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
  INSPIRATION_COMFYUI_WORKFLOW,
  isProcessingTaskStatus,
  logger,
  normalizeOptimizedPrompt,
  parseGenerationAction,
  parsePositiveInt,
  DrawingTypeEnum
} from "./const";

interface IFengShuiRequestBody {
  imageId?: string;
  houseInfo?: string;
  residentProfile?: string;
  residentNeeds?: string;
}

/**
 * 从上下文获取当前用户ID
 */
const getCurrentUserId = (ctx: Context) => {
  const user = ctx.state.user as any;
  return String(user?.uid || user?._id || "");
};

/**
 * 提交图片反馈（仅点赞/取消点赞）
 * action: 'like' | 'cancel'
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
 * 点赞/取消点赞图片
 */
export const likeImage = async (ctx: Context) => {
  const { id } = ctx.params;
  const { action = "toggle" } = ctx.request.body as any;

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

    if (action === "toggle") {
      image.isLiked = !Boolean(image.isLiked);
    } else {
      const feedbackValue = parseGenerationAction(action);
      if (feedbackValue === null) {
        ctx.body = { code: 400, msg: "Invalid action" };
        return;
      }
      image.isLiked = feedbackValue;
    }

    await image.save();
    sendResponse.success(ctx, { isLiked: Boolean(image.isLiked) });
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 收藏图片到个人收藏夹
 */
export const collectImage = async (ctx: Context) => {
  const { id } = ctx.params;
  const userId = getCurrentUserId(ctx);

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

    if (image.userId && image.userId !== userId) {
      ctx.body = { code: 403, msg: "You can only collect your own images" };
      return;
    }

    await UserImageCollect.findOneAndUpdate(
      { userId, imageId: image._id.toString() },
      {
        userId,
        imageId: image._id.toString(),
        imageGenTaskId: image.imageGenTaskId
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    sendResponse.success(ctx, { isCollected: true });
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 取消收藏图片
 */
export const uncollectImage = async (ctx: Context) => {
  const { id } = ctx.params;
  const userId = getCurrentUserId(ctx);

  if (!id) {
    ctx.body = { code: 400, msg: "Image ID is required" };
    return;
  }

  try {
    await UserImageCollect.deleteOne({ userId, imageId: id });
    sendResponse.success(ctx, { isCollected: false });
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 获取用户的图片收藏列表
 */
export const getMyImageCollections = async (ctx: Context) => {
  try {
    const userId = getCurrentUserId(ctx);
    const page = parsePositiveInt(ctx.query.page, DEFAULT_GENERATION_PAGE);
    const pageSize = parsePositiveInt(ctx.query.pageSize, DEFAULT_GENERATION_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [collections, total] = await Promise.all([
      UserImageCollect.find({ userId })
        .sort({ createdTime: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      UserImageCollect.countDocuments({ userId })
    ]);

    const imageIds = collections.map((item) => item.imageId);
    const images = imageIds.length
      ? await ImageGenInfo.find({ _id: { $in: imageIds } }).lean()
      : [];

    const imageMap = images.reduce((map, image) => {
      map[String(image._id)] = image;
      return map;
    }, {} as Record<string, any>);

    const mappedList = collections.map((item) => {
      const image = imageMap[item.imageId];
      const imageUrl = image?.imageUrl || "";
      return {
        imageId: item.imageId,
        imageGenTaskId: item.imageGenTaskId,
        imageUrl,
        fileResourceId: image?.fileResourceId || "",
        width: image?.width || 0,
        height: image?.height || 0,
        isLiked: Boolean(image?.isLiked),
        isCollected: true,
        collectedTime: item.createdTime,
      };
    });
    const list = mappedList.filter((item) => item.imageUrl);

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
    logger.error(`Error getting image collections for user:`, error);
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
      base_images,
      type
    } = ctx.request.body as any;

    if (!prompt) {
      ctx.body = { code: 400, msg: "Prompt is required" };
      return;
    }

    const userId = getCurrentUserId(ctx);
    const activeTask = await GenerationTask.findOne({
      userId,
      purpose: { $in: [TaskPurposeEnum.TXT2IMG, TaskPurposeEnum.IMG2IMG, TaskPurposeEnum.UPSCALE] },
      status: { $in: [TaskStatusEnum.INITIATED, TaskStatusEnum.PENDING, TaskStatusEnum.PROCESSING] }
    }).select("_id");
    if (activeTask) {
      const message = "当前任务正在进行中，喝杯茶等一下吧~";
      ctx.body = { code: 429, msg: message, message };
      return;
    }

    let translatedPrompt = prompt;
    try {
      const translateInput = buildTranslatePromptInput(prompt);
      const translated = await callLLMAPI({ prompt: translateInput, width: 1, height: 1 }, TaskChannelEnum.LLM);
      translatedPrompt = normalizeOptimizedPrompt(translated.content) || prompt;
    } catch (error: any) {
      logger.warn(`Translate prompt failed, fallback to original prompt: ${error?.message || error}`);
    }

    if (type === DrawingTypeEnum.INSPIRATION) {
      translatedPrompt = appendInspirationPromptSuffix(translatedPrompt);
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
    const workflowName = purpose === TaskPurposeEnum.TXT2IMG
      ? INSPIRATION_COMFYUI_WORKFLOW
      : undefined;
    const generationTask = createGenerationTaskRecord(
      userId,
      purpose,
      params,
      translatedPrompt,
      workflowName ? { workflowName } : {}
    );

    await generationTask.save();
    const taskId = generationTask._id.toString();

    // 加入队列
    const queueItem = new GenerationQueue({
      taskId: taskId,
      userId,
      status: 'queued',
      priority: 0,
      progress: 0,
      createdAt: new Date()
    });

    await queueItem.save();

    logger.info(`Task ${taskId} created and queued for user ${userId} (Purpose: ${purpose})`);

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

/**
 * 风水图片生成：根据房屋信息和住户信息生成风水建议图片
 */
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

    const imageUrl = buildObjectPublicUrl(
      imageResource.bucket || BUCKET_NAME,
      imageResource.path
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
        const imageUrl = result?.imageUrl || "";
        sseService.send(sseId, "complete", {
            taskId,
            status: 'completed',
            progress: 100,
            imageUrl,
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
    result.underImageUrl = task.params?.underImage?.url || task.params?.baseImages?.[0] || "";

    // 获取队列进度
    if (isProcessingTaskStatus(task.status)) {
      const queueItem = await GenerationQueue.findOne({ taskId });
      if (queueItem) {
        result.progress = queueItem.progress || 0;
      }
    } else if (task.status === TaskStatusEnum.COMPLETED) {
      result.progress = 100;
      const imageInfo = await ImageGenInfo.findOne({ imageGenTaskId: taskId }).lean();
      if (imageInfo) {
        result.imageUrl = imageInfo.imageUrl || "";
        result.imageId = imageInfo._id;
        result.width = imageInfo.width;
        result.height = imageInfo.height;
      }
      // 保留 images 数组以防新版前端使用
      const images = await ImageGenInfo.find({ imageGenTaskId: taskId }).lean();
      result.images = images.map((image) => ({
        ...image,
        imageUrl: image.imageUrl || ""
      }));
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
    const visibleStatuses = [
      TaskStatusEnum.INITIATED,
      TaskStatusEnum.PENDING,
      TaskStatusEnum.PROCESSING,
      TaskStatusEnum.COMPLETED
    ];

    const historyFilter = {
      userId: user.uid,
      status: { $in: visibleStatuses },
      purpose: { $in: purposeFilterList.length ? purposeFilterList : [TaskPurposeEnum.TXT2IMG, TaskPurposeEnum.IMG2IMG] },
    };

    const tasks = await GenerationTask.find(historyFilter)
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await GenerationTask.countDocuments(historyFilter);

    const taskIds = tasks.map((task) => task._id.toString());
    const queueList = taskIds.length
      ? await GenerationQueue.find({ taskId: { $in: taskIds } }, { taskId: 1, progress: 1 }).lean()
      : [];
    const queueProgressMap = queueList.reduce((map, item) => {
      map[item.taskId] = Math.max(0, Math.min(100, Number(item.progress || 0)));
      return map;
    }, {} as Record<string, number>);
    const imageList = taskIds.length
      ? await ImageGenInfo.find({ imageGenTaskId: { $in: taskIds } }).sort({ createdTime: -1 })
      : [];

    const imageIds = imageList.map((image) => image._id.toString());
    const collectedImageList = imageIds.length
      ? await UserImageCollect.find(
        { userId: user.uid, imageId: { $in: imageIds } },
        { imageId: 1 }
      ).lean()
      : [];
    const collectedImageSet = new Set(collectedImageList.map((item) => String(item.imageId)));

    const imageListWithUrl = imageList.map((image) => ({
      image,
      imageUrl: image.fileResourceId
        ? buildObjectPublicUrl(BUCKET_NAME, image.fileResourceId)
        : (image.imageUrl || "")
    }));

    const imageMap = imageListWithUrl.reduce((map, item) => {
      const image = item.image;
      const imageId = image._id.toString();
      const taskId = image.imageGenTaskId;
      if (!map[taskId]) {
        map[taskId] = [];
      }
      map[taskId].push({
        imageId,
        imageUrl: item.imageUrl,
        fileResourceId: image.fileResourceId,
        width: image.width,
        height: image.height,
        createdTime: image.createdTime,
        isLiked: Boolean(image.isLiked),
        isCollected: collectedImageSet.has(imageId),
        isPublishedToSquare: Boolean(image.isPublishedToSquare),
      });
      return map;
    }, {} as Record<string, Array<{
      imageId: string;
      imageUrl: string;
      fileResourceId: string;
      width?: number;
      height?: number;
      createdTime: Date;
      isLiked: boolean;
      isCollected: boolean;
      isPublishedToSquare: boolean;
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
        progress: task.status === TaskStatusEnum.COMPLETED
          ? 100
          : (queueProgressMap[taskId] !== undefined ? queueProgressMap[taskId] : 0),
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
