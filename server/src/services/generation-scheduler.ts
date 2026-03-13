import axios from "axios";
import { comfyUIClient, comfyUIPool, ComfyUIClient } from "@/lib/comfyui-client";
import { workflowManager } from "@/lib/workflow-manager";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import GenerationQueue, { IGenerationQueue } from "@/models/generationQueue";
import ImageGenTask, { TaskStatusEnum, TaskProviderEnum } from "@/models/imageGenTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { IMAGE_GENERATION_CONFIG } from "@/config/aiModels";

const logger = getLogger("GenerationScheduler");

/**
 * 图像生成调度器
 * 负责从队列中取出待处理的图像生成任务，并将其提交给ComfyUI执行
 */
class GenerationScheduler {
  // 轮询间隔时间（毫秒）
  private pollInterval: number;

  constructor() {
    this.pollInterval = 2000;
  }

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
    // 1. Find Idle ComfyUI Node
    let idleNode: ComfyUIClient | null = null;
    
    try {
        // Check all nodes in parallel with 3s timeout
        const checkPromises = comfyUIPool.map(async (client) => {
            try {
                const stats = await client.getSystemStats(3000);
                // exec_info.queue_remaining indicates tasks in queue
                if (stats?.exec_info?.queue_remaining === 0) {
                    return client;
                }
            } catch (error) {
                // Ignore errors (node down, timeout, etc.)
            }
            return null;
        });
        
        const results = await Promise.all(checkPromises);
        // Pick the first available node
        idleNode = results.find(c => c !== null) || null;
    } catch (error) {
        logger.error("Error checking ComfyUI nodes:", error);
    }

    // 2. Build Query
    const query: any = { status: 'queued' };
    if (!idleNode) {
        // If no ComfyUI node is available, only process Third Party tasks
        query.provider = TaskProviderEnum.THIRD_PARTY;
    }

    // 3. Fetch Task
    const task = await GenerationQueue.findOneAndUpdate(
      query,
      { status: 'processing', startedAt: new Date() },
      { sort: { priority: -1, createdAt: 1 }, new: true }
    );

    // No task pending
    if (!task) {
      return;
    }

    logger.info(`Processing task ${task.taskId} (User: ${task.userId}, Provider: ${task.provider || 'Default'})`);

    // Update Task status
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

    // 4. Dispatch Execution
    if (task.provider === TaskProviderEnum.THIRD_PARTY) {
        // 3rd Party: Fire and forget
        this.runTaskSafe(task);
    } else {
        // ComfyUI Task
        if (idleNode) {
            this.runTaskSafe(task, idleNode);
        } else {
            // Should not happen due to query logic, but handling race condition
            logger.warn(`[Task ${task.taskId}] No idle ComfyUI node found after fetch. Re-queueing.`);
            await GenerationQueue.findByIdAndUpdate(task._id, { status: 'queued', startedAt: null });
            await ImageGenTask.findByIdAndUpdate(task.taskId, { status: TaskStatusEnum.PENDING });
        }
    }
  }

  /**
   * 安全执行任务（包含错误处理）
   */
  private async runTaskSafe(task: IGenerationQueue, client?: ComfyUIClient) {
    try {
      // 执行任务
      if (task.provider === TaskProviderEnum.THIRD_PARTY) {
          await this.executeThirdPartyTask(task);
      } else {
          // If it's a ComfyUI task, client must be provided
          if (!client) throw new Error("ComfyUI client not provided for ComfyUI task");
          await this.executeComfyUITask(task, client);
      }
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
    }
  }



  /**
   * 执行第三方API生图任务
   */
  private async executeThirdPartyTask(task: IGenerationQueue) {
      logger.info(`[Task ${task.taskId}] Executing via Third Party API...`);
      
      const params = task.payload;
      const config = IMAGE_GENERATION_CONFIG;
      
      // Construct Messages for OpenAI-compatible Chat Completion API (Gemini via Proxy)
      const messages: any[] = [
          {
              role: "user",
              content: [
                  { type: "text", text: params.prompt }
              ]
          }
      ];

      // Add Base Images if available
      if (params.baseImages && Array.isArray(params.baseImages)) {
          params.baseImages.forEach((imgUrl: string) => {
              messages[0].content.push({
                  type: "image_url",
                  image_url: { url: imgUrl }
              });
          });
      }

      try {
          const response = await axios.post(`${config.baseUrl}/v1/chat/completions`, {
              model: config.model,
              messages: messages
          }, {
              headers: {
                  [config.apiKeyHeaderKey || 'Authorization']: `Bearer ${config.apiKey}`,
                  'Content-Type': 'application/json'
              },
              timeout: 120000 // 2 minutes timeout for generation
          });

          const content = response.data.choices[0]?.message?.content;
          if (!content) throw new Error("No content in response");

          // Extract Image
          let imageBuffer: Buffer | null = null;
          
          // Check for Base64 Markdown: ![...](data:image/png;base64,...)
          const base64Match = content.match(/!\[.*?\]\(data:image\/.*?;base64,(.*?)\)/);
          if (base64Match && base64Match[1]) {
              imageBuffer = Buffer.from(base64Match[1], 'base64');
          } else {
              // Check for URL Markdown: ![...](https://...)
              const urlMatch = content.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
              if (urlMatch && urlMatch[1]) {
                  const imgUrl = urlMatch[1];
                  logger.info(`[Task ${task.taskId}] Downloading image from URL: ${imgUrl}`);
                  const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                  imageBuffer = Buffer.from(imgRes.data);
              }
          }

          if (!imageBuffer) {
              throw new Error("Could not extract image from response content. Content preview: " + content.substring(0, 100));
          }

          // Upload to MinIO
          const filename = `${task.taskId}_${Date.now()}.png`;
          logger.info(`[Task ${task.taskId}] Uploading result to MinIO as ${filename}...`);
          await minioClient.putObject(BUCKET_NAME, filename, imageBuffer);
          
          // Generate URL
          const imageUrl = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);

          // Save Info
          const imageGenInfo = new ImageGenInfo({
              userId: task.userId,
              imageGenTaskId: task.taskId,
              prompt: params.prompt,
              width: params.width,
              height: params.height,
              imageUrl: imageUrl,
              model: config.model,
              comfyuiPromptId: "THIRD_PARTY",
              comfyuiClientId: "THIRD_PARTY",
              seed: params.seed,
              workflowJson: JSON.stringify(messages),
              createdTime: new Date()
          });
          await imageGenInfo.save();

          // Clean up queue
          await GenerationQueue.findByIdAndDelete(task._id);
          
          // Update Task status
          await ImageGenTask.findByIdAndUpdate(task.taskId, {
              status: TaskStatusEnum.COMPLETED,
              completedTime: new Date()
          });
          
          // SSE Push
          if (task.sseId) {
              sseService.send(task.sseId, "complete", {
                  taskId: task.taskId,
                  status: TaskStatusEnum.COMPLETED,
                  progress: 100,
                  imageUrl: imageUrl
              });
          }
          
          logger.info(`[Task ${task.taskId}] Third Party generation completed successfully.`);

      } catch (error: any) {
          logger.error(`[Task ${task.taskId}] Third Party API Error:`, error.message);
          if (error.response) {
              logger.error("Response data:", JSON.stringify(error.response.data));
          }
          throw error;
      }
  }

  /**
   * 执行ComfyUI生图任务
   */
  private async executeComfyUITask(task: IGenerationQueue, client: ComfyUIClient) {
    const params = task.payload;

    // 1. 生成ComfyUI工作流
    const workflow = workflowManager.generateWorkflow("1_None", params);


    // 2. 将prompt提交到ComfyUI队列
    logger.info(`[Task ${task.taskId}] Queueing prompt to ComfyUI...`);
    const queueRes = await client.queuePrompt(workflow);
    const promptId = queueRes.prompt_id;

    // 记录ComfyUI的prompt ID
    logger.info(`[Task ${task.taskId}] ComfyUI Prompt ID: ${promptId}`);

    // 更新图像生成任务的ComfyUI信息
    await ImageGenTask.findByIdAndUpdate(task.taskId, {
      'comfyui.promptId': promptId
    });

    // 3. 轮询等待ComfyUI完成并更新进度
    const history = await this.waitForCompletion(promptId, task, client);

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
   * @param client ComfyUI客户端实例
   * @param timeoutMs 超时时间（毫秒），默认5分钟
   * @returns 历史记录对象，如果超时则返回null
   */
  private async waitForCompletion(promptId: string, task: IGenerationQueue, client: ComfyUIClient, timeoutMs: number = 300000): Promise<any> {
    const startTime = Date.now();
    let lastProgressUpdate = Date.now();

    // 循环轮询直到完成或超时
    while (Date.now() - startTime < timeoutMs) {
      try {
        // 检查历史记录判断任务是否完成
        const history = await client.getHistory(promptId);
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
