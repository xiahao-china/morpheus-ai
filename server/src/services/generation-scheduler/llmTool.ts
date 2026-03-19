import axios from "axios";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import GenerationQueue, { IGenerationQueue } from "@/models/generationQueue";
import GenerationTask, { IGenerationTask, TaskStatusEnum, TaskChannelEnum, TaskPurposeChannelMapping } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import { getLogger } from "@/lib/log4js";
import { IMAGE_GENERATION_CONFIG, VISION_LLM_CONFIG, LLM_CONFIG, AIModelConfig } from "@/config/aiModels";
import { incrementTaskProgress } from "@/services/task";

const logger = getLogger("GenerationScheduler-LLMTool");

// 任务渠道与模型配置及最近调用耗时的映射关系
type ChannelConfigType = {
    config: AIModelConfig | undefined;
    lastCallDuration: number; // 记录上一次调用的完整耗时（毫秒），用于预估进度
};

export const ChannelConfigMapping: Record<TaskChannelEnum, ChannelConfigType> = {
    [TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE]: { config: IMAGE_GENERATION_CONFIG, lastCallDuration: 15000 }, // 默认预估15秒
    [TaskChannelEnum.LLM]: { config: LLM_CONFIG, lastCallDuration: 5000 }, // 默认预估5秒
    [TaskChannelEnum.VLLM]: { config: VISION_LLM_CONFIG, lastCallDuration: 10000 }, // 默认预估10秒
    [TaskChannelEnum.COMFYUI]: { config: undefined, lastCallDuration: 0 } // ComfyUI 不使用此配置
};

/**
 * 调用第三方大语言模型API的核心逻辑
 * @param params 任务参数
 * @param taskChannel 任务渠道
 * @returns 返回生成的文本内容或图片相关信息
 */
export const callLLMAPI = async (params: any, taskChannel: TaskChannelEnum): Promise<{ content: string, imageUrl?: string, savedImageGenId?: string, messages: any[] }> => {
    const channelData = ChannelConfigMapping[taskChannel];
    const config = channelData?.config;
    if (!config) {
        throw new Error(`Unsupported channel for third party execution: ${taskChannel}`);
    }

    const startTime = Date.now();

    // 构建OpenAI兼容的Chat Completion API消息
    const messages: any[] = [
        {
            role: "user",
            content: [
                { type: "text", text: params.prompt || "请分析这张图片的风水" }
            ]
        }
    ];

    const baseImages = Array.isArray(params.baseImages) ? params.baseImages.filter(Boolean) : [];
    const normalizedBaseImages = await Promise.all(baseImages.map(async (imgUrl: string) => {
        if (taskChannel !== TaskChannelEnum.VLLM) {
            return imgUrl;
        }
        try {
            const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const mimeType = (imgRes.headers?.['content-type'] || 'image/jpeg').split(';')[0];
            const base64 = Buffer.from(imgRes.data).toString('base64');
            return `data:${mimeType};base64,${base64}`;
        } catch (error: any) {
            logger.warn(`[callLLMAPI] Failed to transform image url to data url: ${error?.message || error}`);
            return imgUrl;
        }
    }));

    normalizedBaseImages.forEach((imgUrl: string) => {
        messages[0].content.push({
            type: "image_url",
            image_url: { url: imgUrl }
        });
    });

    logger.info(`[callLLMAPI] Calling ${config.baseUrl}/chat/completions with model ${config.model}`);

    const requestConfig = {
        headers: {
            [config.apiKeyHeaderKey || 'Authorization']: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        },
        timeout: 120000
    };
    let response: any;
    try {
        response = await axios.post(`${config.baseUrl}/chat/completions`, {
            model: config.model,
            messages: messages
        }, requestConfig);
    } catch (error: any) {
        if (taskChannel !== TaskChannelEnum.VLLM) {
            throw error;
        }
        const fallbackMessages = JSON.parse(JSON.stringify(messages));
        fallbackMessages[0].content = fallbackMessages[0].content.map((item: any) => {
            if (item?.type === "image_url" && item?.image_url?.url) {
                return {
                    type: "image_url",
                    image_url: item.image_url.url
                };
            }
            return item;
        });
        response = await axios.post(`${config.baseUrl}/chat/completions`, {
            model: config.model,
            messages: fallbackMessages
        }, requestConfig);
    }

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error("No content in response");

    let imageUrl: string | undefined = undefined;
    let savedImageGenId: string | undefined = undefined;

    // 如果是生图任务，尝试提取图像
    if (taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE) {
        let imageBuffer: Buffer | null = null;
        // 检查Base64 Markdown格式：![...](data:image/png;base64,...)
        const base64Match = content.match(/!\[.*?\]\(data:image\/.*?;base64,(.*?)\)/);
        if (base64Match && base64Match[1]) {
            imageBuffer = Buffer.from(base64Match[1], 'base64');
        } else {
            // 检查URL Markdown格式：![...](https://...)
            const urlMatch = content.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
            if (urlMatch && urlMatch[1]) {
                const imgUrl = urlMatch[1];
                logger.info(`Downloading image from URL: ${imgUrl}`);
                const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(imgRes.data);
            }
        }

        if (!imageBuffer) {
            throw new Error("Could not extract image from response content. Content preview: " + content.substring(0, 100));
        }

        // 上传到MinIO
        const taskId = params.taskId || `sync_${Date.now()}`;
        const filename = `${taskId}_${Date.now()}.png`;
        logger.info(`Uploading result to MinIO as ${filename}...`);
        await minioClient.putObject(BUCKET_NAME, filename, imageBuffer);

        // 生成访问URL
        imageUrl = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);

         // 保存信息
        if (params.userId && params.taskId) {
            const imageGenInfo = new ImageGenInfo({
                userId: params.userId,
                imageGenTaskId: params.taskId,
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
            savedImageGenId = imageGenInfo._id.toString();
        }
    }

    // 记录完整调用耗时
    const duration = Date.now() - startTime;
    ChannelConfigMapping[taskChannel].lastCallDuration = duration;
    logger.info(`LLM API call for channel ${taskChannel} took ${duration}ms`);

    return { content, imageUrl, savedImageGenId, messages };
};

/**
 * 启动 SSE 进度推送定时器
 * @param sseId SSE 连接 ID
 * @param taskId 任务 ID
 * @param taskChannel 任务渠道
 * @returns 定时器 ID，用于后续清理
 */
const startSSEProgressTimer = (sseId: string, taskId: string, taskChannel: TaskChannelEnum): NodeJS.Timeout => {
    let progress = 0;
    const estimatedDuration = ChannelConfigMapping[taskChannel]?.lastCallDuration || 15000;
    const updateIntervalMs = 1000;
    // 每次更新增加的进度百分比，基于预估耗时计算，确保在预估时间内达到约90%
    const progressStep = Math.max(1, Math.floor((90 / (estimatedDuration / updateIntervalMs))));

    return setInterval(() => {
        if (progress < 95) {
            // 如果快到95%了，减慢速度
            if (progress > 85) {
                progress += 1;
            } else {
                progress += progressStep;
            }
            // 确保不超过95%
            progress = Math.min(progress, 95);

            sseService.send(sseId, "status", {
                taskId: taskId,
                status: TaskStatusEnum.PROCESSING,
                progress: progress
            });
        }
    }, updateIntervalMs);
};

/**
 * 执行第三方API生图任务 (异步队列版本)
 * @param task 队列任务对象
 */
export const executeThirdPartyTask = async (task: IGenerationQueue, generationTask: IGenerationTask) => {
    logger.info(`[Task ${task.taskId}] Executing via Third Party API...`);

    // 正确获取 params：Mongoose 文档需要通过 toJSON() 或直接访问 _doc 获取原始数据
    const taskParams = generationTask.params?.toJSON ? generationTask.params.toJSON() :
                       generationTask.params?._doc ? generationTask.params._doc :
                       generationTask.params;

    const params = {
        ...taskParams,
        taskId: task.taskId,
        userId: task.userId
    };

    logger.info(`[executeThirdPartyTask] params.prompt length: ${params.prompt?.length || 0}`);

    const taskChannel = (generationTask.purpose && TaskPurposeChannelMapping[generationTask.purpose]) || TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE;

    // 启动SSE进度推送定时器
    let progressInterval: NodeJS.Timeout | null = null;
    if (task.sseId) {
        progressInterval = startSSEProgressTimer(task.sseId, task.taskId, taskChannel);
    }

    try {
        const { content, imageUrl, savedImageGenId } = await callLLMAPI(params, taskChannel);

        // 清理定时器
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        // 清理队列
        await GenerationQueue.findByIdAndDelete(task._id);

        // 更新任务状态和结果
        const updateData: any = {
            status: TaskStatusEnum.COMPLETED,
            completedTime: new Date()
        };

        if (taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE && savedImageGenId) {
            updateData.$push = { ImageGenIds: savedImageGenId };
        } else {
            updateData.textGenText = content;
        }

        await GenerationTask.findByIdAndUpdate(task.taskId, updateData);

        // 触发任务进度
        await incrementTaskProgress(task.userId, 'first_generation', 1);

        // SSE推送
        if (task.sseId) {
            sseService.send(task.sseId, "complete", {
                taskId: task.taskId,
                status: TaskStatusEnum.COMPLETED,
                progress: 100,
                imageUrl: imageUrl, // 生图任务有图片
                content: content    // LLM任务有文本
            });
        }

        logger.info(`[Task ${task.taskId}] Third Party generation completed successfully.`);

    } catch (error: any) {
        // 清理定时器
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        logger.error(`[Task ${task.taskId}] Third Party API Error:`, error.message);
        if (error.response) {
            logger.error("Response data:", JSON.stringify(error.response.data));
        }
        throw error;
    }
}
