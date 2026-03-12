import { httpPost } from "@/lib/request/http";


export interface ICreateImagesTaskParams {
  modelId: number;
  styleModelId?: number;
  styleExtractionLevel?: number;
  prompt: string;
  negativePrompt?: string;
  promptImageId?: number;
  negativePromptImageId?: number;
  underImageId?: number;
  underImageExtractionLevel?: number;
  referImageId?: number;
  referImageExtractionLevel?: number;
  ratio?: string;
  width: number;
  height: number;
  count?: number;
}


interface GenerateTaskResponse {
  id: number;
}

export const createImagesTask = async (params: ICreateImagesTaskParams) => {
  return httpPost<ICreateImagesTaskParams, GenerateTaskResponse>('/images/generate', params);
}
