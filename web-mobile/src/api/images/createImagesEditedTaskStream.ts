import { streamGet, streamPost } from '@/lib/request/http'
import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const';

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
  type: EFunctionGroupMode;
  userId: number;
  prompt: string;
  negativePrompt?: string;
  styleModel?: string;
  width: number;
  height: number;
  comfyuiClientId?: string;
  styleExtractionLevel?: number;
  styleExtractionLevelOutward?: number;

  concreteSceneId?: number;

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

  originalImageGenerationId?: number;
  originalImageUrl?: string;
  originalImageId?: string;

  uploadImageUrl?: string;
  uploadImageId?: string;

  maskImageUrl?: string;
  maskImageId?: string;

  scene: string;
  ratio: string;
  count: number;
  comfyuiPromptId?: string;
  startedTime?: string;
  completedTime?: string;
  images: GeneratedImageInfo[];
  styleModelId?: number;
  magnificationOutward?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface IGenerateTaskData {
  type: "TASK_INFO" | "PROGRESS_INFO";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
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



export const createGenerateTaskStream = async (taskId: string) => {
  return streamGet<object, IGenerateTaskData>(
    `/images/event/edited/${taskId}`,
    {},
    { responseType: 'stream' },
  );
};
