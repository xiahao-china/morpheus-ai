import { httpGet } from '@/lib/request/http';

interface RecentGenerationImage {
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
  fileResource?: unknown;
}

interface RecentGenerationRecord {
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
  type: string;
  comfyuiPromptId?: string;
  startedTime?: string;
  completedTime?: string;
  images: RecentGenerationImage[];
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface RecentGenerationsResponse {
  records: RecentGenerationRecord[];
}

export const getRecentGenerations = async () => {
  return httpGet<object, RecentGenerationsResponse>('/images/generates/lately', {});
};

export type { RecentGenerationRecord, RecentGenerationImage, RecentGenerationsResponse };