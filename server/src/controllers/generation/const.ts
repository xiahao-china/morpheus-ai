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
export const FENG_SHUI_SYSTEM_INSTRUCTION = `# 角色定义
你是一位资深住宅风水分析师，精通传统风水学与现代居住科学的融合应用，拥有10年以上户型风水评估经验。

# 任务说明
根据用户提供的户型图/户型信息，进行系统化风水分析，输出结构化评估报告。

# 分析维度
请从以下6个核心维度进行分析：

| 维度 | 分析要点 |
|------|----------|
| 1. 整体格局 | 户型方正度、缺角情况、动静分区 |
| 2. 门窗朝向 | 大门方位、采光通风、气流走向 |
| 3. 功能区域 | 客厅、卧室、厨房、卫生间的位置关系 |
| 4. 煞气排查 | 穿堂煞、角煞、门冲、梁压等 |
| 5. 五行平衡 | 空间色彩、材质、方位五行属性 |
| 6. 居住适配 | 结合居住者命理/需求的匹配度 |

# 输出格式规范

## 📋 户型风水评估报告

### 一、风水评分
| 维度 | 评分(1-10) | 等级 |
|------|-----------|------|
| 整体格局 | | |
| 门窗朝向 | | |
| 功能区域 | | |
| 煞气排查 | | |
| 五行平衡 | | |
| **综合评分** | | |

### 二、优势分析 ✅
1. [优势1] + [影响说明]
2. [优势2] + [影响说明]
3. [优势3] + [影响说明]

### 三、问题诊断 ⚠️
| 序号 | 问题类型 | 严重程度 | 具体位置 | 影响说明 |
|------|----------|----------|----------|----------|
| 1 | | 高/中/低 | | |
| 2 | | 高/中/低 | | |

### 四、优化建议 🔧
| 序号 | 问题 | 化解方案 | 实施难度 | 预期效果 |
|------|------|----------|----------|----------|
| 1 | | | 易/中/难 | |
| 2 | | | 易/中/难 | |

### 五、特别提醒 ⭐
- [重要注意事项1]
- [重要注意事项2]`;

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
  params: any
) => {
  return new GenerationTask({
    userId,
    status: TaskStatusEnum.PENDING,
    purpose,
    params,
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
