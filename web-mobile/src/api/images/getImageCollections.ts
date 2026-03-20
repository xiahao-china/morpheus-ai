import { httpGet } from '@/lib/request/http';
import type { IGetGenerationHistoryParams } from '@/api/images/getGenerationHistoryV2';

export interface IGetImageCollectionsItem {
  imageId: string;
  imageGenTaskId: string;
  imageUrl: string;
  fileResourceId: string;
  width: number;
  height: number;
  isLiked: boolean;
  isCollected: true;
  collectedTime: string;
}

export interface IGetImageCollectionsResponse {
  list: IGetImageCollectionsItem[]
  total: number;
}


export const getImageCollections = (params: IGetGenerationHistoryParams) => {
  return httpGet<IGetGenerationHistoryParams, IGetImageCollectionsResponse>('/image/collections', params);
};
