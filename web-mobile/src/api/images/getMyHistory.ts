import { httpGet } from '@/lib/request/http'

export enum EHistoryFilterTime {
  '48h' = '48h',
  '7d' = '7d',
  '30d' = '30d',
  'all' = 'all',
}

export interface IGetGenerationHistoryParams {
  pageNo: number
  pageSize: number
  timeRange: EHistoryFilterTime
  type?: string | null,
}

export interface ImageInfo {
  id: number
  userId: number
  imageGenerationId: number
  fileResourceId: number
  imageUrl: string
  thumbnailUrl: string
  recordThumbnailUrl: string
  url256?: string
  width: number
  height: number
  createdTime: string
  updatedTime: string
  fileResource: null
  isCollected: boolean;
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
  height: number
  comfyuiClientId: string
  styleExtractionLevel: number
  promptImageUrl: null
  negativePromptImageUrl: null
  underImageUrl: string
  underImageName: null
  underImageExtractionLevel: number
  underImageWidth: null
  underImageHeight: null
  promptImageName: null
  negativePromptImageName: null
  referImageUrl: string
  referImageName: null
  referImageExtractionLevel: number
  ratio: string
  count: number
  type: string
  comfyuiPromptId: string
  startedTime: string
  completedTime: string
  generatedImages: ImageInfo[]
  editedGeneratedImages: ImageInfo[]
  status: string
}

export interface IGetGenerationHistoryResponse {
  records: IGetGenerationHistoryItem[]
}

export const getMyHistory = async (params: IGetGenerationHistoryParams) => {
  return httpGet<IGetGenerationHistoryParams, IGetGenerationHistoryResponse>(
    '/images/records',
    params,
  )
}
