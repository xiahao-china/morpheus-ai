import { httpPost } from "@/lib/request/http";


export interface GenerateTaskParams {
  referImageExtractionLevelOutward?: number;
  // underImageWidth?: string;
  prompt: string;
  modelId: number;
  width: number;
  height: number;
  // underImageHeight?: string;
  ratio?: string;
  styleExtractionLevelOutward?: number;
  count?: number;
  promptImageId?: number;
  styleModelId?: number;
  referImageId?: number;
  negativePrompt?: string;
  underImageExtractionLevelOutward?: number;
  negativePromptImageId?: number;
  underImageId?: number;
  type: string;
}

interface GenerateTaskResponse {
  id: number;
}

export const createGenerateTask = async (params: GenerateTaskParams) => {
  const formData = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return httpPost<FormData, GenerateTaskResponse>('/images/generate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
}
