import { comfyUIPool, ComfyUIClient, ComfyUINodeStatus } from "@/lib/comfyui-client";
import { workflowManager } from "@/lib/workflow-manager";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import GenerationQueue, { IGenerationQueue } from "@/models/generationQueue";
import GenerationTask, { IGenerationTask, TaskStatusEnum, TaskChannelEnum } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { incrementTaskProgress } from "@/services/task";
import { executeThirdPartyTask, callLLMAPI } from "./llmTool";
import {
  POLL_INTERVAL,
  DEFAULT_TIMEOUT,
  resolveTaskChannel,
  isSyncExecutableChannel,
  isThirdPartyChannel,
  buildTaskRuntimeParams,
  buildSyncCompletionUpdate,
  buildSyncTaskResponse
} from "./const";

const logger = getLogger("GenerationScheduler");

// 图像生成调度器，负责从队列中取出待处理的图像生成任务，并将其提交给ComfyUI执行
class GenerationScheduler {
  // 轮询间隔时间（毫秒）
  private pollInterval: number;
  constructor() {
    this.pollInterval = POLL_INTERVAL;
  }
  // 启动调度器，开始循环处理任务队列
  public start() {
    logger.info("Starting Generation Scheduler...");
    this.scheduleNext();
  }

  // 立即触发一次队列检查
  public triggerCheck() {
    this.processQueue().catch(err => logger.error("Triggered check error:", err));
  }

  /**
   * 处理同步任务（仅限大语言模型，直接返回结果）
   * @param generationTask 生成任务对象
   * @returns 生成结果（文本或相关信息）
   */
  public async executeSyncTask(generationTask: IGenerationTask): Promise<any> {
    const taskChannel = resolveTaskChannel(generationTask);
    
    if (!isSyncExecutableChannel(taskChannel)) {
      throw new Error(`Sync execution is not supported for channel: ${taskChannel}`);
    }

    const taskId = generationTask._id.toString();
    logger.info(`[SyncTask ${taskId}] Starting synchronous execution (Channel: ${taskChannel})...`);

    // 更新任务状态为处理中
    await GenerationTask.findByIdAndUpdate(taskId, {
      status: TaskStatusEnum.PROCESSING,
      startedTime: new Date()
    });

    try {
        const params = buildTaskRuntimeParams(generationTask, taskId);
        const { content, savedImageGenId } = await callLLMAPI(params, taskChannel);
        const updateData = buildSyncCompletionUpdate(taskChannel, content, savedImageGenId);

        await GenerationTask.findByIdAndUpdate(taskId, updateData);

        logger.info(`[SyncTask ${taskId}] Completed successfully.`);

        return buildSyncTaskResponse(taskId, content, savedImageGenId);
    } catch (error: any) {
        logger.error(`[SyncTask ${taskId}] Failed:`, error);
        
        await GenerationTask.findByIdAndUpdate(taskId, {
            status: TaskStatusEnum.FAILED,
            completedTime: new Date()
        });

        throw error;
    }
  }

  // 调度下一个任务，使用setTimeout实现循环调度，处理完成后继续调度下一个
  private scheduleNext() {
    setTimeout(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        logger.error("Error processing queue:", error);
      } finally {
        this.scheduleNext();
      }
    }, this.pollInterval);
  }

  // 处理任务队列，从队列中取出最高优先级、最早创建的任务进行执行
  private async processQueue() {
    const queuedTasks = await GenerationQueue.find({ status: 'queued' }).sort({ priority: -1, createdAt: 1 });
    if (!queuedTasks.length) {
      return;
    }

    const taskIds = queuedTasks.map(task => task.taskId);
    const generationTasks = await GenerationTask.find({ _id: { $in: taskIds } });
    const generationTaskMap = new Map(generationTasks.map(task => [task._id.toString(), task]));

    const llmQueue: Array<{ queueTask: IGenerationQueue; generationTask: IGenerationTask; taskChannel: TaskChannelEnum }> = [];
    const comfyQueue: Array<{ queueTask: IGenerationQueue; generationTask: IGenerationTask; taskChannel: TaskChannelEnum }> = [];

    for (const queueTask of queuedTasks) {
      const generationTask = generationTaskMap.get(queueTask.taskId);
      if (!generationTask) {
        logger.error(`GenerationTask not found for queue item ${queueTask.taskId}`);
        await GenerationQueue.findByIdAndUpdate(queueTask._id, { status: 'failed', error: 'GenerationTask not found' });
        continue;
      }

      const taskChannel = resolveTaskChannel(generationTask);
      if (isThirdPartyChannel(taskChannel)) {
        llmQueue.push({ queueTask, generationTask, taskChannel });
      } else if (taskChannel === TaskChannelEnum.COMFYUI) {
        comfyQueue.push({ queueTask, generationTask, taskChannel });
      } else {
        logger.warn(`[Task ${queueTask.taskId}] Unknown channel: ${taskChannel}. Marking as failed.`);
        await GenerationQueue.findByIdAndUpdate(queueTask._id, { status: 'failed', error: 'Unknown channel' });
        await GenerationTask.findByIdAndUpdate(queueTask.taskId, { status: TaskStatusEnum.FAILED });
      }
    }

    for (const item of llmQueue) {
      const startedTask = await this.tryStartTask(item.queueTask, item.generationTask, item.taskChannel);
      if (!startedTask) {
        continue;
      }
      this.runTaskSafe(startedTask, item.generationTask);
    }

    if (!comfyQueue.length) {
      return;
    }

    let idleNodes: ComfyUIClient[] = [];
    try {
      idleNodes = await comfyUIPool.getAvailableNodes(2000);
    } catch (error) {
      logger.error("Error checking ComfyUI nodes:", error);
      return;
    }

    if (!idleNodes.length) {
      return;
    }

    const comfyDispatchQueue = comfyQueue.slice(0, idleNodes.length);
    for (let i = 0; i < comfyDispatchQueue.length; i++) {
      const item = comfyDispatchQueue[i];
      const assignedNode = idleNodes[i];
      const startedTask = await this.tryStartTask(item.queueTask, item.generationTask, item.taskChannel);
      if (!startedTask) {
        continue;
      }
      this.runTaskSafe(startedTask, item.generationTask, assignedNode);
    }
  }

  private async tryStartTask(
    queueTask: IGenerationQueue,
    generationTask: IGenerationTask,
    taskChannel: TaskChannelEnum
  ): Promise<IGenerationQueue | null> {
    const startedTask = await GenerationQueue.findOneAndUpdate(
      { _id: queueTask._id, status: 'queued' },
      { status: 'processing', startedAt: new Date() },
      { new: true }
    );
    if (!startedTask) {
      return null;
    }

    logger.info(`Processing task ${startedTask.taskId} (User: ${startedTask.userId}, Channel: ${taskChannel})`);

    await GenerationTask.findByIdAndUpdate(generationTask._id, {
      status: TaskStatusEnum.PROCESSING,
      startedTime: new Date()
    });

    if (startedTask.sseId) {
      sseService.send(startedTask.sseId, "status", {
        taskId: startedTask.taskId,
        status: TaskStatusEnum.PROCESSING,
        progress: 0
      });
    }

    return startedTask;
  }

  // 安全执行任务（包含错误处理）
  // @param task 队列任务对象
  // @param generationTask 生成任务对象
  // @param client ComfyUI客户端实例（可选）
  private async runTaskSafe(task: IGenerationQueue, generationTask: IGenerationTask, client?: ComfyUIClient) {
    try {
      const taskChannel = resolveTaskChannel(generationTask);

      if (isThirdPartyChannel(taskChannel)) {
          await executeThirdPartyTask(task, generationTask);
      } else if (taskChannel === TaskChannelEnum.COMFYUI) {
          if (!client) throw new Error("ComfyUI client not provided for ComfyUI task");
          await this.executeComfyUITask(task, generationTask, client);
      } else {
        throw new Error(`Unsupported channel: ${taskChannel}`);
      }
    } catch (error: any) {
      logger.error(`Task ${task.taskId} failed:`, error);

      // 如果有 client 并且失败了，重置其状态
      if (client) {
          client.status = ComfyUINodeStatus.IDLE;
      }

      // 更新队列任务状态为失败
      await GenerationQueue.findByIdAndUpdate(task._id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });

      // 更新图像生成任务状态为失败
      await GenerationTask.findByIdAndUpdate(task.taskId, {
        status: TaskStatusEnum.FAILED,
        completedTime: new Date()
      });

      // SSE推送：失败
      if (task.sseId) {
        sseService.send(task.sseId, "error", {
            taskId: task.taskId,
            status: TaskStatusEnum.FAILED,
            error: error.message
        });
      }
    }
  }

  // 执行ComfyUI生图任务
  // @param task 队列任务对象
  // @param generationTask 生成任务对象
  // @param client ComfyUI客户端实例
  private async executeComfyUITask(task: IGenerationQueue, generationTask: IGenerationTask, client: ComfyUIClient) {
    const rawParams = generationTask.params?.toJSON
      ? generationTask.params.toJSON()
      : (generationTask.params?._doc ? generationTask.params._doc : generationTask.params);
    const params = { ...rawParams };
    if (generationTask.translatedPrompt) {
      params.prompt = generationTask.translatedPrompt;
    }
    if (!params.seed || Number.isNaN(Number(params.seed))) {
      params.seed = Math.floor(Math.random() * 1000000000000000);
    }
    const clientId = `morpheus_${task.taskId}_${Date.now()}`;

    // 1. 生成ComfyUI工作流
    const workflow = workflowManager.generateWorkflow("1_None", params);

    // 2. 将prompt提交到ComfyUI队列
    console.log('workflow',workflow);
    logger.info(`[Task ${task.taskId}] Queueing prompt to ComfyUI...`);
    const queueRes = await client.queuePrompt(workflow, clientId);
    const promptId = queueRes.prompt_id;

    // 记录ComfyUI的prompt ID
    logger.info(`[Task ${task.taskId}] ComfyUI Prompt ID: ${promptId}`);

    // 更新图像生成任务的ComfyUI信息
    await GenerationTask.findByIdAndUpdate(task.taskId, {
      'comfyui.promptId': promptId
    });

    await this.pushTaskProgress(task, 1);

    const history = await this.waitForCompletion(promptId, task, client, workflow, clientId);

    if (!history) {
      throw new Error("Generation timed out or failed");
    }

    // 4. 从历史记录中提取输出
    const outputs = history[promptId]?.outputs;
    if (!outputs) {
      throw new Error("No outputs found in history");
    }

    // 查找图像输出节点
    let imageOutput: any = null;
    for (const nodeId in outputs) {
      if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
        imageOutput = outputs[nodeId].images[0];
        break;
      }
    }

    if (!imageOutput) {
      throw new Error("No image output found");
    }

    // 5. 获取生成的图像并上传到MinIO
    logger.info(`[Task ${task.taskId}] Fetching image ${imageOutput.filename}...`);
    const imageBuffer = await client.getImage(
      imageOutput.filename,
      imageOutput.subfolder,
      imageOutput.type
    );

    // 生成MinIO存储文件名
    const minioFilename = `${Date.now()}-${imageOutput.filename}`;
    logger.info(`[Task ${task.taskId}] Uploading to MinIO as ${minioFilename}...`);
    await minioClient.putObject(BUCKET_NAME, minioFilename, imageBuffer);

    // 生成预签名访问URL
    const imageUrl = await minioClient.presignedGetObject(BUCKET_NAME, minioFilename, 24*60*60);

    // 6. 保存生成的图像信息到数据库
    const imageGenInfo = new ImageGenInfo({
      userId: task.userId,
      imageGenTaskId: task.taskId, // 这是GenerationTask的ID
      fileResourceId: minioFilename,
      imageUrl,
      width: params.width,
      height: params.height,
      createdTime: new Date()
    });
    await imageGenInfo.save();

    // 7. 更新图像生成任务状态为已完成
    await GenerationTask.findByIdAndUpdate(task.taskId, {
      status: TaskStatusEnum.COMPLETED,
      completedTime: new Date(),
      $push: { ImageGenIds: imageGenInfo._id.toString() }
    });

    // 触发任务进度
    await incrementTaskProgress(task.userId, 'first_generation', 1);

    // SSE推送：已完成
    if (task.sseId) {
        sseService.send(task.sseId, "complete", {
            taskId: task.taskId,
            status: TaskStatusEnum.COMPLETED,
            progress: 100,
            imageUrl,
            imageId: imageGenInfo._id
        });
    }

    // 8. 从队列中移除已完成的任务
    logger.info(`[Task ${task.taskId}] Completed. Removing from queue.`);
    await GenerationQueue.findByIdAndDelete(task._id);
    
    // 更新节点状态为IDLE
    client.status = ComfyUINodeStatus.IDLE;
  }

  /**
   * 轮询等待ComfyUI任务完成
   * @param promptId ComfyUI的prompt ID
   * @param task 队列任务对象
   * @param client ComfyUI客户端实例
   * @param timeoutMs 超时时间（毫秒），默认5分钟
   * @returns 历史记录对象，如果超时则返回null
   */
  private async pushTaskProgress(task: IGenerationQueue, progress: number) {
    const safeProgress = Math.max(0, Math.min(100, progress));
    if ((task.progress || 0) >= safeProgress) {
      return;
    }

    task.progress = safeProgress;
    await GenerationQueue.findByIdAndUpdate(task._id, { progress: safeProgress });

    if (task.sseId) {
      sseService.send(task.sseId, "status", {
        taskId: task.taskId,
        status: TaskStatusEnum.PROCESSING,
        progress: safeProgress
      });
    }
  }

  private async waitForCompletion(
    promptId: string,
    task: IGenerationQueue,
    client: ComfyUIClient,
    workflow: Record<string, any>,
    clientId: string,
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<any> {
    const startTime = Date.now();
    const totalNodes = Math.max(1, Object.keys(workflow || {}).length);
    const closeWsListener = client.listenExecutionProgress({
      promptId,
      clientId,
      totalNodes,
      onProgress: async ({ progress }) => {
        await this.pushTaskProgress(task, progress);
      },
      onComplete: async () => {
        await this.pushTaskProgress(task, 99);
      },
      onError: async (error) => {
        logger.warn(`[Task ${task.taskId}] ComfyUI websocket error: ${error.message}`);
      }
    });

    try {
      while (Date.now() - startTime < timeoutMs) {
        try {
          const history = await client.getHistory(promptId);
          if (history && history[promptId]) {
            await this.pushTaskProgress(task, 100);
            return history;
          }
        } catch (e) {}

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      closeWsListener();
    }

    return null;
  }
}

export const generationScheduler = new GenerationScheduler();
