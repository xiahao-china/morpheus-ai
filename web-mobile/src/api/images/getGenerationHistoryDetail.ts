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
  id: number
  userId: number
  prompt: string
  negativePrompt: string
  styleModel: null
  model: string
  seed: number
  width: number
  modelId: number;
  styleModelId?: number;
  height: number
  comfyuiClientId: string
  styleExtractionLevel: number
  styleExtractionLevelOutward: number

  promptImageUrl: null
  negativePromptImageUrl: null
  underImageUrl: string
  underImageName: null
  underImageExtractionLevel: number
  underImageExtractionLevelOutward: number
  underImageId?: number;

  enlargeTyped?: EScaleType;
  scene?: string;

  underImageWidth: null
  underImageHeight: null
  promptImageName: null
  negativePromptImageName: null
  referImageUrl: string
  referImageName: null
  referImageExtractionLevel: number
  referImageExtractionLevelOutward: number
  referImageId?: number;

  magnificationOutward?: number;

  ratio: string
  count: number
  type: EFunctionGroupMode
  comfyuiPromptId: string
  startedTime: string
  completedTime: string
  images: ImageInfo[]
  status: string
  modelOutwardName: string
  styleModelOutwardName: string
}

export const getGenerationsDetail = async (taskId: string) => {
  return httpGet<object, IGetGenerationHistoryItem>(
    `/images/generates/${taskId}`,
    {},
  )
}
