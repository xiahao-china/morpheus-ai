import { Context as KoaContext } from "koa";
import GenerationTask, { TaskPurposeEnum, TaskStatusEnum } from "@/models/generationTask";
import { getLogger } from "@/lib/log4js";

export type Context = KoaContext | any;

export const logger = getLogger("GenerationController");
export const DEFAULT_GENERATION_WIDTH = 1024;
export const DEFAULT_GENERATION_HEIGHT = 1024;
export const DEFAULT_GENERATION_PAGE = 1;
export const DEFAULT_GENERATION_PAGE_SIZE = 20;
export const LLM_OPTIMIZE_SYSTEM_INSTRUCTION = `作为一名Stable Diffusion/ComfyUI室内设计提示词专家，请将用户输入的简短描述优化并润色为高质量的英文提示词。
要求：
1. 提取用户意图并翻译为准确的英文。
2. 自动补充高质量相关的提示词（如：(Masterpiece, Best Quality, 8k, highly detailed, photorealistic)）。
3. 补充适当的室内设计光影、材质、氛围描述（如：cinematic lighting, ray tracing, architectural photography）。
4. 只返回最终的英文提示词字符串，不要返回任何其他解释性文字。`;
export const LLM_TRANSLATE_SYSTEM_INSTRUCTION = `请将用户输入的中文图像提示词翻译为自然、准确、适合AI生图模型理解的英文提示词。
要求：
1. 保留原始语义，不要臆造未提及内容。
2. 使用简洁高质量英文表达，适合Stable Diffusion/ComfyUI等生图模型。
3. 只返回英文提示词字符串，不要返回解释。`;
export const FENG_SHUI_SYSTEM_INSTRUCTION = `你是一位资深住宅风水分析师。请基于用户提供的户型图与补充信息，输出可直接被前端消费的JSON结果。

必须严格遵守以下要求：
1. 只返回JSON字符串，不要返回Markdown、代码块、解释文字或前后缀。
2. JSON必须可被JSON.parse直接解析。
3. 字段必须完整，结构如下：
{
  "score": number,
  "level": "上吉" | "吉" | "中" | "平" | "凶",
  "summary": string,
  "items": [
    {
      "type": "danger" | "warning" | "success",
      "title": string,
      "tag": string,
      "impact": string,
      "suggestion": string,
      "analysis": string
    }
  ]
}
4. score取值为0-10的整数，level与score语义一致。
5. items至少返回3条，每条都要有明确问题或优势，title/tag需简洁。
6. 若为问题项，type优先用danger或warning，并给出impact与suggestion。
7. 若为优势项，type用success，并在analysis中说明依据。
8. 不允许返回null，不要省略items字段。`;

export const getGeneratedTaskPurpose = (baseImages: unknown) => {
  const hasBaseImages = Array.isArray(baseImages) && baseImages.length > 0;
  return hasBaseImages ? TaskPurposeEnum.IMG2IMG : TaskPurposeEnum.TXT2IMG;
};

export const getDimensionsByPurpose = (purpose: TaskPurposeEnum, ratio: unknown) => {
  if (purpose === TaskPurposeEnum.IMG2IMG) {
    return {
      width: DEFAULT_GENERATION_WIDTH,
      height: DEFAULT_GENERATION_HEIGHT
    };
  }
  return calculateDimensions(typeof ratio === "string" ? ratio : undefined);
};

export const generateTaskSeed = () => Math.floor(Math.random() * 1000000000000000);
export const generateFilenamePrefix = () => `Morpheus_${Date.now()}`;
export const createSseId = () => `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const isProcessingTaskStatus = (status: TaskStatusEnum) => {
  return status === TaskStatusEnum.PENDING || status === TaskStatusEnum.PROCESSING || status === TaskStatusEnum.INITIATED;
};

export const normalizeOptimizedPrompt = (content: string) => {
  const optimizedPrompt = content.trim();
  if (optimizedPrompt.startsWith('"') && optimizedPrompt.endsWith('"')) {
    return optimizedPrompt.slice(1, -1);
  }
  return optimizedPrompt;
};

export const buildOptimizePromptInput = (prompt: string) => {
  return `${LLM_OPTIMIZE_SYSTEM_INSTRUCTION}\n\n用户输入: ${prompt}\n\n优化后的提示词:`;
};

export const buildTranslatePromptInput = (prompt: string) => {
  return `${LLM_TRANSLATE_SYSTEM_INSTRUCTION}\n\n用户输入: ${prompt}\n\n英文提示词:`;
};

export const buildFengShuiPromptInput = (input: {
  houseInfo?: string;
  residentProfile?: string;
  residentNeeds?: string;
}) => {
  const details = [
    input.houseInfo ? `户型补充信息：${input.houseInfo}` : "",
    input.residentProfile ? `居住者命理信息：${input.residentProfile}` : "",
    input.residentNeeds ? `居住者需求：${input.residentNeeds}` : ""
  ].filter(Boolean).join("\n");
  const userInput = details || "未提供文字补充信息，请以图片识别结果为主完成分析。";
  return `${FENG_SHUI_SYSTEM_INSTRUCTION}\n\n用户补充信息：\n${userInput}`;
};

export const parseGenerationAction = (action: string) => {
  if (action === "like") return true;
  if (action === "dislike") return false;
  if (action === "cancel") return undefined;
  return null;
};

export const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
};

export const createGenerationTaskRecord = (
  userId: string,
  purpose: TaskPurposeEnum,
  params: any,
  translatedPrompt?: string
) => {
  return new GenerationTask({
    userId,
    status: TaskStatusEnum.PENDING,
    purpose,
    params,
    translatedPrompt,
    comfyui: {
      seed: params.seed
    },
    createdTime: new Date()
  });
};

export const createTaskDetailBase = (task: any) => ({
  taskId: task._id,
  status: task.status,
  createdTime: task.createdTime,
  startedTime: task.startedTime,
  completedTime: task.completedTime,
  progress: 0
});

/**
 * 根据比例计算宽高，最大边为1024
 * @param ratio 比例字符串，如 '1:1', '16:9', '9:16'
 * @returns { width: number, height: number }
 */
export const calculateDimensions = (ratio?: string): { width: number; height: number } => {
  const MAX_EDGE = DEFAULT_GENERATION_WIDTH;
  
  if (!ratio || !ratio.includes(':')) {
    // 默认 1:1
    return { width: MAX_EDGE, height: MAX_EDGE };
  }

  const [wStr, hStr] = ratio.split(':');
  const wRatio = parseFloat(wStr);
  const hRatio = parseFloat(hStr);

  if (isNaN(wRatio) || isNaN(hRatio) || wRatio <= 0 || hRatio <= 0) {
    return { width: MAX_EDGE, height: MAX_EDGE };
  }

  if (wRatio > hRatio) {
    // 宽 > 高，宽为最大边
    return {
      width: MAX_EDGE,
      height: Math.round((MAX_EDGE / wRatio) * hRatio)
    };
  } else if (hRatio > wRatio) {
    // 高 > 宽，高为最大边
    return {
      width: Math.round((MAX_EDGE / hRatio) * wRatio),
      height: MAX_EDGE
    };
  } else {
    // 1:1
    return { width: MAX_EDGE, height: MAX_EDGE };
  }
};
