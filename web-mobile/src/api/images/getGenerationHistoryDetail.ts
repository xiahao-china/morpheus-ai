import { httpGet } from '@/lib/request/http'
import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const';
import { EScaleType } from '@/pages/CarefullyReviseTheImage/components/ScaleType/const';


export interface ImageInfo {
  id: number
  userId: number
  imageGenerationId: number
  fileResourceId: number
  imageUrl: string
  thumbnailUrl: string
  width: number
  height: number
  createdTime: string
  updatedTime: string
  fileResource: null
  isCollected: 0 | 1;
  isPublishedSquare: boolean;
  recordThumbnailUrl: string;
}

export interface IGetGenerationHistoryItem {
  taskId: string;
  status: string;
  createdTime: string;
  startedTime?: string;
  completedTime?: string;
  progress: number;
  imageUrl?: string;
  imageId?: string;
  width?: number;
  height?: number;

  // 兼容旧字段
  images?: { imageUrl: string, id: number }[];
}

export const getGenerationsDetail = async (taskId: string) => {
  return httpGet<object, IGetGenerationHistoryItem>(
    `/image/detail/${taskId}`,
    {},
  )
}
