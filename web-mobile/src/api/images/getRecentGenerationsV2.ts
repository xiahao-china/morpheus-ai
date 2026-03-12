import { httpGet } from '@/lib/request/http';
import {
  EFunctionGroupMode
} from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const'

interface RecentGenerationImage {
  id: number;
  userId: number;
  imageGenerationId: number;
  fileResourceId: number;
  imageUrl: string;
  thumbnailUrl: string;
  recordThumbnailUrl: string;
  width: number;
  height: number;
  createdTime: string;
  updatedTime: string;
  fileResource?: unknown;
}


interface RecentGenerationV2Record {
  id: number;
  userId: number;
  prompt: string;
  negativePrompt?: string | null; // 兼容 null 值
  styleModel?: string;
  model: string;
  seed: number;
  width: number;
  height: number;
  comfyuiClientId?: string;
  styleExtractionLevel?: number;
  promptImageUrl?: string;
  negativePromptImageUrl?: string;
  underImageUrl?: string;
  underImageName?: string;
  underImageExtractionLevel?: number;
  underImageWidth?: number;
  underImageHeight?: number;
  promptImageName?: string;
  negativePromptImageName?: string;
  referImageUrl?: string;
  referImageName?: string;
  referImageExtractionLevel?: number;
  ratio: string;
  count: number;
  type: EFunctionGroupMode;
  comfyuiPromptId?: string;
  startedTime?: string;
  completedTime?: string;
  images: RecentGenerationImage[];
  generatedImages:RecentGenerationImage[];
  editedGeneratedImages: RecentGenerationImage[];
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  modelId: number; // 新增字段
  modelOutwardName: string; // 新增字段
  styleModelId: number; // 新增字段
  styleModelOutwardName: string; // 新增字段
  styleExtractionLevelOutward: number; // 新增字段
  workflowName: string; // 新增字段
  underImageId?: number | null; // 新增字段
  underImageExtractionLevelOutward?: number | null; // 新增字段
  referImageId?: number | null; // 新增字段
  referImageExtractionLevelOutward?: number | null; // 新增字段
  createdTime: string; // 新增字段
  updatedTime: string; // 新增字段
  scene?: string | null; // 新增字段
  fromDrawing?: string | null; // 新增字段
  uploadImageId?: number | null; // 新增字段
  maskImageUrl?: string | null; // 新增字段
  maskImageId?: number | null; // 新增字段
  sourceType: string; // 新增字段
}

interface RecentGenerationsResponse {
  records: RecentGenerationV2Record[];
}

export const getRecentGenerationsV2 = async () => {
  return httpGet<object, RecentGenerationsResponse>('/images/records/lately', {});
};

export type { RecentGenerationV2Record, RecentGenerationImage, RecentGenerationsResponse };
