import { comfyUIClient } from "@/lib/comfyui-client";
import { workflowManager } from "@/lib/workflow-manager";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import GenerationQueue, { IGenerationQueue } from "@/models/generationQueue";
import ImageGenTask, { TaskStatusEnum } from "@/models/imageGenTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("GenerationScheduler");

/**
 * 图像生成调度器
 * 负责从队列中取出待处理的图像生成任务，并将其提交给ComfyUI执行
 */
class GenerationScheduler {
  // 标记当前是否正在处理任务，避免并发处理
  private isProcessing: boolean = false;
  // 轮询间隔时间（毫秒）
  private pollInterval: number = 2000; // 2秒

  /**
   * 启动调度器
   * 开始循环处理任务队列
   */
  public start() {
    logger.info("Starting Generation Scheduler...");
    this.scheduleNext();
  }

  /**
   * 立即触发一次队列检查
   */
  public triggerCheck() {
    this.processQueue().catch(err => logger.error("Triggered check error:", err));
  }

  /**
   * 调度下一个任务
   * 使用setTimeout实现循环调度，处理完成后继续调度下一个
   */
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

  /**
   * 处理任务队列
   * 从队列中取出最高优先级、最早创建的任务进行执行
   */
  private async processQueue() {
    // 如果当前正在处理任务，则跳过本次轮询
    if (this.isProcessing) return;

    // 查找下一个排队中的任务（按优先级降序、创建时间升序）
    const task = await GenerationQueue.findOneAndUpdate(
      { status: 'queued' },
      { status: 'processing', startedAt: new Date() },
      { sort: { priority: -1, createdAt: 1 }, new: true }
    );

    // 没有待处理的任务
    if (!task) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing task ${task.taskId} (User: ${task.userId})`);

    // 更新图像生成任务状态为处理中
    await ImageGenTask.findByIdAndUpdate(task.taskId, {
      status: TaskStatusEnum.PROCESSING,
      startedTime: new Date()
    });
    
    // SSE Push: Processing
    if (task.sseId) {
        sseService.send(task.sseId, "status", {
            taskId: task.taskId,
            status: TaskStatusEnum.PROCESSING,
            progress: 0
        });
    }

    try {
      // 执行任务
      await this.executeTask(task);
    } catch (error: any) {
      logger.error(`Task ${task.taskId} failed:`, error);

      // 更新队列任务状态为失败
      await GenerationQueue.findByIdAndUpdate(task._id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      });

      // 更新图像生成任务状态为失败
      await ImageGenTask.findByIdAndUpdate(task.taskId, {
        status: TaskStatusEnum.FAILED,
        completedTime: new Date()
      });
      
      // SSE Push: Failed
      if (task.sseId) {
        sseService.send(task.sseId, "error", {
            taskId: task.taskId,
            status: TaskStatusEnum.FAILED,
            error: error.message
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行图像生成任务
   * @param task 队列任务对象
   */
  private async executeTask(task: IGenerationQueue) {
    const params = task.payload;

    // 1. 生成ComfyUI工作流
    const workflow = workflowManager.generateWorkflow("1_None", params);

    // 2. 将prompt提交到ComfyUI队列
    logger.info(`[Task ${task.taskId}] Queueing prompt to ComfyUI...`);
    const queueRes = await comfyUIClient.queuePrompt(workflow);
    const promptId = queueRes.prompt_id;

    // 记录ComfyUI的prompt ID
    logger.info(`[Task ${task.taskId}] ComfyUI Prompt ID: ${promptId}`);

    // 更新图像生成任务的ComfyUI信息
    await ImageGenTask.findByIdAndUpdate(task.taskId, {
      'comfyui.promptId': promptId
    });

    // 3. 轮询等待ComfyUI完成并更新进度
    const history = await this.waitForCompletion(promptId, task);

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
    const imageBuffer = await comfyUIClient.getImage(
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
      imageGenTaskId: task.taskId, // 这是ImageGenTask的ID
      fileResourceId: minioFilename,
      imageUrl,
      width: params.width,
      height: params.height,
      createdTime: new Date()
    });
    await imageGenInfo.save();

    // 7. 更新图像生成任务状态为已完成
    await ImageGenTask.findByIdAndUpdate(task.taskId, {
      status: TaskStatusEnum.COMPLETED,
      completedTime: new Date()
    });
    
    // SSE Push: Completed
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
  }

  /**
   * 轮询等待ComfyUI任务完成
   * @param promptId ComfyUI的prompt ID
   * @param task 队列任务对象
   * @param timeoutMs 超时时间（毫秒），默认5分钟
   * @returns 历史记录对象，如果超时则返回null
   */
  private async waitForCompletion(promptId: string, task: IGenerationQueue, timeoutMs: number = 300000): Promise<any> {
    const startTime = Date.now();
    let lastProgressUpdate = Date.now();

    // 循环轮询直到完成或超时
    while (Date.now() - startTime < timeoutMs) {
      try {
        // 检查历史记录判断任务是否完成
        const history = await comfyUIClient.getHistory(promptId);
        if (history && history[promptId]) {
          // 任务已完成，更新进度为100%
          await GenerationQueue.findByIdAndUpdate(task._id, { progress: 100 });
          return history;
        }

        // 模拟进度更新（每5秒更新一次）
        if (Date.now() - lastProgressUpdate > 5000) {
           const currentProgress = task.progress || 0;
           if (currentProgress < 90) {
             const newProgress = currentProgress + 10;
             await GenerationQueue.findByIdAndUpdate(task._id, { progress: newProgress });
             task.progress = newProgress; // 更新本地对象
             
             // SSE Push: Progress
             if (task.sseId) {
                 sseService.send(task.sseId, "status", {
                     taskId: task.taskId,
                     status: TaskStatusEnum.PROCESSING,
                     progress: newProgress
                 });
             }
           }
           lastProgressUpdate = Date.now();
        }

      } catch (e) {
        // 忽略轮询错误，继续尝试
      }
      // 等待1秒后继续轮询
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return null;
  }
}

export const generationScheduler = new GenerationScheduler();
