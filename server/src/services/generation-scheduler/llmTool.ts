import axios from "axios";
import { minioClient, BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";
import { sseService } from "@/services/sse-service";
import GenerationQueue, { IGenerationQueue } from "@/models/generationQueue";
import GenerationTask, { IGenerationTask, TaskStatusEnum, TaskChannelEnum, TaskPurposeChannelMapping } from "@/models/generationTask";
import ImageGenInfo from "@/models/imageGenInfo";
import FileResource from "@/models/fileResource";
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
    [TaskChannelEnum.VLLM]: { config: VISION_LLM_CONFIG, lastCallDuration: 30000 }, // 默认预估10秒
    [TaskChannelEnum.COMFYUI]: { config: undefined, lastCallDuration: 0 } // ComfyUI 不使用此配置
};

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
};

const normalizeBaseUrl = (baseUrl: string): string => {
    return baseUrl
        .trim()
        .replace(/^['"`\s]+|['"`\s]+$/g, "")
        .replace(/\/+$/g, "");
};

const buildRequestUrl = (baseUrl: string, endpointPath: string): string => {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    const normalizedPath = endpointPath
        .trim()
        .replace(/^['"`\s]+|['"`\s]+$/g, "")
        .replace(/^\/+/, "/");
    return `${normalizedBase}${normalizedPath}`;
};

const extractContentFromAnthropic = (data: any): string => {
    const contentList = Array.isArray(data?.content) ? data.content : [];
    return contentList
        .map((item: any) => {
            if (item?.type === "text" && typeof item?.text === "string") {
                return item.text;
            }
            return "";
        })
        .filter(Boolean)
        .join("\n");
};

const buildAnthropicPayload = (config: AIModelConfig, messages: any[], params: any) => {
    const normalizedMessages = (messages || []).map((message: any) => ({
        role: message.role,
        content: (message.content || []).map((item: any) => {
            if (item?.type === "text") {
                return { type: "text", text: item.text };
            }
            if (item?.type === "image_url") {
                const imageUrl = typeof item?.image_url === "string"
                    ? item.image_url
                    : item?.image_url?.url;
                if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
                    const matched = imageUrl.match(/^data:(.*?);base64,(.*)$/);
                    if (matched && matched[2]) {
                        return {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: matched[1] || "image/jpeg",
                                data: matched[2]
                            }
                        };
                    }
                }
            }
            return item;
        })
    }));

    return {
        model: config.model,
        messages: normalizedMessages,
        max_tokens: params.maxTokens || 1024
    };
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
    const shouldUseDataUrl = taskChannel === TaskChannelEnum.VLLM || taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE;
    const normalizedBaseImages = await Promise.all(baseImages.map(async (baseImage: string) => {
        if (!shouldUseDataUrl) {
            return baseImage;
        }
        if (baseImage.startsWith("data:image/")) {
            return baseImage;
        }
        try {
            if (/^https?:\/\//i.test(baseImage)) {
                const imgRes = await axios.get(baseImage, { 
                    responseType: "arraybuffer", 
                    timeout: 30000,
                    proxy: false
                });
                const mimeType = (imgRes.headers?.["content-type"] || "image/jpeg").split(";")[0];
                const base64 = Buffer.from(imgRes.data).toString("base64");
                return `data:${mimeType};base64,${base64}`;
            }

            const fileResource = await FileResource.findById(baseImage).lean();
            if (fileResource?.path) {
                const objectStream = await minioClient.getObject(fileResource.bucket || BUCKET_NAME, fileResource.path);
                const imageBuffer = await streamToBuffer(objectStream as unknown as NodeJS.ReadableStream);
                const mimeType = (fileResource.mimeType || "image/jpeg").split(";")[0];
                const base64 = imageBuffer.toString("base64");
                return `data:${mimeType};base64,${base64}`;
            }

            throw new Error(`图片资源不存在: ${baseImage}`);
        } catch (error: any) {
            if (taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE) {
                throw new Error(`[callLLMAPI] 第三方生图要求 base64 图片输入，无法转换图片: ${error?.message || error}`);
            }
            logger.warn(`[callLLMAPI] 图片转数据URL失败: ${error?.message || error}`);
            return baseImage;
        }
    }));

    normalizedBaseImages.forEach((imgUrl: string) => {
        messages[0].content.push({
            type: "image_url",
            image_url: { url: imgUrl }
        });
    });

    const requestProtocol = config.requestProtocol || "openai";
    const endpointPath = config.endpointPath || (requestProtocol === "anthropic" ? "/v1/messages" : "/chat/completions");
    const completionUrl = buildRequestUrl(config.baseUrl, endpointPath);
    const requestTimeoutMs = taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE
        ? 300000
        : taskChannel === TaskChannelEnum.VLLM
            ? 180000
            : 120000;

    logger.info(`[callLLMAPI] 调用 ${config.model}, url=${completionUrl}, timeout=${requestTimeoutMs}ms`);

    const authMode = config.authMode || "bearer";
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (authMode === "x-api-key") {
        headers[config.apiKeyHeaderKey || "x-api-key"] = config.apiKey;
    } else {
        headers[config.apiKeyHeaderKey || 'Authorization'] = `Bearer ${config.apiKey}`;
    }
    if (requestProtocol === "anthropic") {
        headers["anthropic-version"] = "2023-06-01";
    }

    const requestConfig: any = {
        headers,
        timeout: requestTimeoutMs,
        proxy: false
    };
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

    let response: any;
    if (requestProtocol === "anthropic") {
        response = await axios.post(
            completionUrl,
            buildAnthropicPayload(config, fallbackMessages, params),
            requestConfig
        );
    } else {
        try {
            response = await axios.post(completionUrl, {
                model: config.model,
                messages,
                max_tokens: params.maxTokens || 1024
            }, requestConfig);
        } catch (error: any) {
            if (taskChannel !== TaskChannelEnum.VLLM) {
                throw error;
            }
            response = await axios.post(completionUrl, {
                model: config.model,
                messages: fallbackMessages,
                max_tokens: params.maxTokens || 1024
            }, requestConfig);
        }
    }

    const content = requestProtocol === "anthropic"
        ? extractContentFromAnthropic(response.data)
        : response.data.choices[0]?.message?.content;
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
                logger.info(`从URL下载图像: ${imgUrl}`);
                const imgRes = await axios.get(imgUrl, { 
                    responseType: 'arraybuffer',
                    proxy: false
                });
                imageBuffer = Buffer.from(imgRes.data);
            }
        }

        if (!imageBuffer) {
            throw new Error("无法从响应内容中提取图像. Content preview: " + content.substring(0, 100));
        }

        // 上传到MinIO
        const taskId = params.taskId || `sync_${Date.now()}`;
        const filename = `${taskId}_${Date.now()}.png`;
        logger.info(`结果上传到MinIO as ${filename}...`);
        await minioClient.putObject(BUCKET_NAME, filename, imageBuffer);

        imageUrl = buildObjectPublicUrl(BUCKET_NAME, filename);

         // 保存信息
        if (params.userId && params.taskId) {
            const imageGenInfo = new ImageGenInfo({
                userId: params.userId,
                imageGenTaskId: params.taskId,
                fileResourceId: filename,
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
    logger.info(`调用LLM API 渠道 ${taskChannel} 耗时 ${duration}ms`);

    return { content, imageUrl, savedImageGenId, messages };
};

/**
 * 启动 SSE 进度推送定时器
 * @param task 队列任务
 * @param taskChannel 任务渠道
 * @returns 定时器 ID，用于后续清理
 */
const startSSEProgressTimer = (task: IGenerationQueue, taskChannel: TaskChannelEnum): NodeJS.Timeout => {
    let progress = Math.max(1, Number(task.progress || 0));
    const estimatedDuration = ChannelConfigMapping[taskChannel]?.lastCallDuration || 15000;
    const updateIntervalMs = 1000;
    const progressStep = Math.max(1, Math.floor((90 / (estimatedDuration / updateIntervalMs))));

    return setInterval(() => {
        if (progress < 95) {
            if (progress > 85) {
                progress += 1;
            } else {
                progress += progressStep;
            }
            progress = Math.min(progress, 95);
            task.progress = progress;
            void GenerationQueue.findByIdAndUpdate(task._id, { progress }).catch((error: any) => {
                logger.warn(`[任务 ${task.taskId}] 持久化队列进度失败: ${error?.message || error}`);
            });

            if (task.sseId) {
                sseService.send(task.sseId, "status", {
                    taskId: task.taskId,
                    status: TaskStatusEnum.PROCESSING,
                    progress: progress
                });
            }
        }
    }, updateIntervalMs);
};

/**
 * 执行第三方API生图任务 (异步队列版本)
 * @param task 队列任务对象
 */
export const executeThirdPartyTask = async (task: IGenerationQueue, generationTask: IGenerationTask) => {
    logger.info(`[任务 ${task.taskId}] 通过第三方API执行...`);

    // 正确获取 params：Mongoose 文档需要通过 toJSON() 或直接访问 _doc 获取原始数据
    const taskParams = generationTask.params?.toJSON ? generationTask.params.toJSON() :
                       generationTask.params?._doc ? generationTask.params._doc :
                       generationTask.params;

    const params = {
        ...taskParams,
        taskId: task.taskId,
        userId: task.userId
    };

    const taskChannel = (generationTask.purpose && TaskPurposeChannelMapping[generationTask.purpose]) || TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE;
    if (taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE && generationTask.translatedPrompt) {
        params.prompt = generationTask.translatedPrompt;
    }
    logger.info(`[executeThirdPartyTask] 参数提示词长度: ${params.prompt?.length || 0}`);

    let progressInterval: NodeJS.Timeout | null = null;
    progressInterval = startSSEProgressTimer(task, taskChannel);

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

        logger.info(`[任务 ${task.taskId}] 第三方生成成功完成.`);

    } catch (error: any) {
        // 清理定时器
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        logger.error(`[任务 ${task.taskId}] 第三方API错误:`, error.message);
        if (error.response) {
            logger.error("响应数据:", JSON.stringify(error.response.data));
        }
        throw error;
    }
}
