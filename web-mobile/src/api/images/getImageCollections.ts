import { httpGet } from '@/lib/request/http';
import type {
  IGetGenerationHistoryParams,
  ImageInfo
} from '@/api/images/getGenerationHistoryV2';

export interface IGetImageCollectionsItem {
  imageEditedId?: number;
  imageId: number;
  imageGenerationId?: number;
  isSatisfied: null;
  isCollected: true;
  comment: null,
  generatedImages: ImageInfo
  editedGeneratedImages: ImageInfo
}

export interface IGetImageCollectionsResponse {
  records: IGetImageCollectionsItem[]
}


export const getImageCollections = (params: IGetGenerationHistoryParams) => {
  return httpGet<IGetGenerationHistoryParams, IGetImageCollectionsResponse>('/images/interaction/collections', params);
};
