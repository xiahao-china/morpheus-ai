import { httpGet } from '@/lib/request/http';

interface GeneratedImageResponse {
  id: number;
  userId: number;
  imageGenerationId: number;
  fileResourceId: number;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  createdTime: string;
  updatedTime: string;
  fileResource?: {
    id: number;
    userId: number;
    imageGenerationId: number;
    originalName: string;
    uploadFileType?: string;
    fileType: string;
    fileSize: number;
    url: string;
    status: number;
    uploadTime: string;
    downloadCount: number;
    createdTime: string;
    updatedTime: string;
  };
}

interface ImageGenerationResponse {
  id: number;
  userId: number;
  prompt: string;
  negativePrompt?: string;
  styleModel?: string;
  model: string;
  seed: number;
  width: number;
  height: number;
  modelId: number;
  styleModelId?: number;
  comfyuiClientId?: string;
  styleExtractionLevel?: number;
  styleExtractionLevelOutward?: number;

  promptImageUrl?: string;
  negativePromptImageUrl?: string;
  underImageUrl?: string;
  underImageName?: string;
  underImageExtractionLevel?: number;
  underImageExtractionLevelOutward?: number;
  underImageId?: number;

  underImageWidth?: number;
  underImageHeight?: number;
  promptImageName?: string;
  negativePromptImageName?: string;
  referImageUrl?: string;
  referImageName?: string;
  referImageExtractionLevel?: number;
  referImageExtractionLevelOutward?: number;
  referImageId?: number;

  ratio: string;
  count: number;
  comfyuiPromptId?: string;
  startedTime?: string;
  completedTime?: string;
  images: GeneratedImageResponse[];
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}


export const getGenerateTaskStatus = async (taskId: number) => {
  return httpGet<object, ImageGenerationResponse>(`/images/generates/${taskId}`, {});
};

export type GetTaskStatusResponse = ImageGenerationResponse;

export type { ImageGenerationResponse, GeneratedImageResponse };
