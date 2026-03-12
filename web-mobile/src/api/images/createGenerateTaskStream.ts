import { streamGet, httpGet } from '@/lib/request/http';

interface GeneratedImageInfo {
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

export interface GeneratedImageResponse {
  id: number;
  userId: number;
  prompt: string;
  negativePrompt?: string;
  styleModel?: string;
  model: string;
  seed: number;
  width: number;
  height: number;
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
  images: GeneratedImageInfo[];
  modelId: number;
  styleModelId?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface GenerateTaskState {
  type: 'TASK_INFO' | 'PROGRESS_INFO';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  promptId?: string | null;
  value: number;
  max: number;
  node: string | null;
  percent: number;
  data: GeneratedImageResponse | null;
  generationId: number;
  userId: number;
  message: string;
}

export const createGenerateTaskStream = async (taskId: string | number) => {
  return streamGet<object, GenerateTaskState>(
    `/images/event/generate/${taskId}`,
    {},
    { responseType: 'stream' },
  );
};

export const createGenerateTask = async (taskId: string | number) => {
  return httpGet<object, GenerateTaskState>(
    `/images/event/generate/${taskId}`,
    {},
    { responseType: 'stream' },
  );
};
