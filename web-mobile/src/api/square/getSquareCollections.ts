import { httpGet } from '@/lib/request/http';
import type { IGetGenerationHistoryParams } from '@/api/images/getGenerationHistoryV2';

export interface IGetSquareCollectionsItem {
  imageId: string;
  imageGenTaskId: string;
  imageUrl: string;
  fileResourceId: string;
  width: number;
  height: number;
  isLiked: boolean;
  isCollected: true;
  collectedTime: string;
  squareId: string;
}

export interface IGetSquareCollectionsResponse {
  list: IGetSquareCollectionsItem[]
  total: number;
}

export const getSquareCollections = (params: IGetGenerationHistoryParams) => {
  return httpGet<IGetGenerationHistoryParams, IGetSquareCollectionsResponse>('/square/collections', params);
};
