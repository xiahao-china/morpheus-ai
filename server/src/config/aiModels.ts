import { serverConfig } from "./base";

// AI Models Configuration (Gemini, Banana, etc.)
export const AI_MODELS_CONFIG = {
  gemini: {
    apiKey: serverConfig.aiModels?.gemini?.apiKey || process.env.GEMINI_API_KEY || "",
    baseUrl: serverConfig.aiModels?.gemini?.baseUrl || "https://generativelanguage.googleapis.com",
  },
  banana: {
    apiKey: serverConfig.aiModels?.banana?.apiKey || process.env.BANANA_API_KEY || "",
    modelKey: serverConfig.aiModels?.banana?.modelKey || "",
  }
};
