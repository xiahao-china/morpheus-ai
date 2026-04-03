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
  id: number;
  taskId: string;
  type: EFunctionGroupMode;
  status: string;
  prompt: string;
  negativePrompt: string;
  modelId: number;
  styleModelId?: number;
  count: number;
  scene?: string;
  underImageUrl: string;
  styleModelOutwardName: string;
  magnificationOutward?: number;
  enlargeTyped?: EScaleType;
  referImageUrl: string;
  modelOutwardName: string;
  styleExtractionLevelOutward?: number;
  underImageExtractionLevelOutward?: number;
  referImageExtractionLevelOutward?: number;
  underImageId?: number;
  referImageId?: number;
  createdTime: string;
  startedTime?: string;
  completedTime?: string;
  progress: number;
  imageUrl?: string;
  imageId?: string;
  width: number;
  height: number;
  images: ImageInfo[];
  generatedImages?: ImageInfo[];
  editedGeneratedImages?: ImageInfo[];
}

export const getGenerationsDetail = async (taskId: string) => {
  return httpGet<object, IGetGenerationHistoryItem>(
    `/image/detail/${taskId}`,
    {},
  )
}
