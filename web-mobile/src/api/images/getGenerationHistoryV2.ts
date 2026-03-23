import { httpGet } from '@/lib/request/http'

export enum EHistoryFilterTime {
  '48h' = '48h',
  '7d' = '7d',
  '30d' = '30d',
  'all' = 'all',
}

export interface ImageInfo {
  id: number
  userId: number
  imageGenerationId: number
  fileResourceId: number
  imageUrl: string
  thumbnailUrl: string
  recordThumbnailUrl: string
  width: number
  height: number
  createdTime: string
  updatedTime: string
  fileResource: null
  isCollected: boolean;
}

export interface IGetGenerationHistoryItem {
  _id: string;
  userId: string;
  imageGenTaskId: string;
  imageUrl: string;
  imageId?: string;
  width: number;
  height: number;
  createdTime: string | Date;
  completedTime?: string | Date;
  prompt?: string;
  underImageUrl?: string;
  underImageId?: string;
  type?: string;
  status?: string;
  progress?: number;
  images?: Array<{
    imageId: string;
    imageUrl: string;
    fileResourceId?: string;
    width?: number;
    height?: number;
    createdTime: string | Date;
    isLiked?: boolean;
    isPublishedToSquare?: boolean;
  }>;

  // 兼容旧字段
  generatedImages?: { imageUrl: string }[];
}

export interface IGetGenerationHistoryResponse {
  list: IGetGenerationHistoryItem[];
  total: number;
}

export const getRecentGenerationsV2 = async (params?: { page?: number, pageSize?: number }) => {
  return httpGet<object, IGetGenerationHistoryResponse>(
    '/image/history',
    params || { page: 1, pageSize: 20 },
  )
}
