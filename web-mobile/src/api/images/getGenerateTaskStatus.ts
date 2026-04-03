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

export interface ImageGenerationResponse {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  imageUrl?: string;
  imageId?: string;
  createdTime?: string;
  startedTime?: string;
  completedTime?: string;
  
  // 兼容旧字段
  images?: { imageUrl: string, id: number }[];
}


export const getGenerateTaskStatus = async (taskId: string) => {
  return httpGet<object, ImageGenerationResponse>(`/image/detail/${taskId}`, {});
};

export type GetTaskStatusResponse = ImageGenerationResponse;

export type { GeneratedImageResponse };
