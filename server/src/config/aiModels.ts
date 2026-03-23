/**
 * AI Models Configuration
 * 参照 ai-design-backend-main 配置
 */

// 基础 AI 模型接口
export interface AIModelConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  apiKeyHeaderKey?: string;
  endpointPath?: string;
  requestProtocol?: "openai" | "anthropic";
  authMode?: "bearer" | "x-api-key";
}

// 生图 AI 配置（使用 Gemini）
export const IMAGE_GENERATION_CONFIG: AIModelConfig = {
  apiKey: "sk-TZHc0Ru54BclqUEKcyan0ujxXH9LYrU4tofXjSFVPEPJiAc5",
  baseUrl: "https://aigc.x-see.cn/v1",
  model: "gemini-3.1-flash-image-preview",
  apiKeyHeaderKey: "Authorization",
  endpointPath: "/chat/completions",
  requestProtocol: "openai",
  authMode: "bearer",
};

// 视觉大语言模型配置
export const VISION_LLM_CONFIG: AIModelConfig = {
  apiKey: "sk-434a09ccb0264d9aab87b3825e840da3",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen3.5-plus",
  apiKeyHeaderKey: "Authorization",
  endpointPath: "/chat/completions",
  requestProtocol: "openai",
  authMode: "bearer",
};

// 大语言模型配置（使用 MiniMax）
export const LLM_CONFIG: AIModelConfig = {
  apiKey: "sk-efi+xXN5HgTJ4U/o+SVbN18o+r/PBgI5LKmPOGa2ilI=",
  baseUrl: "http://113.108.105.54:8188",
  model: "MiniMax-M2.5",
  apiKeyHeaderKey: "x-api-key",
  endpointPath: "/v1/messages",
  requestProtocol: "anthropic",
  authMode: "x-api-key",
};

// 导出统一配置对象
export const AI_MODELS_CONFIG = {
  imageGeneration: IMAGE_GENERATION_CONFIG,
  visionLlm: VISION_LLM_CONFIG,
  llm: LLM_CONFIG,
};
