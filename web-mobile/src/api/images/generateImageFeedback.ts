import { httpDelete, httpPost } from '@/lib/request/http'

export interface IFeedbackInfo{
  imageId: string;
  isLiked: boolean;
  isCollected: boolean;
}

export enum ESourceType{
  EDITED = 'EDITED',
  GENERATION = 'GENERATION',
}

export const generateImageFeedbackLike = async (id: string) => {
  return httpPost<{ action: string }, IFeedbackInfo>(`/image/${id}/like`, {
    action: 'toggle',
  });
};

export const generateImageCollect = async (id: string) => {
  return httpPost<object, IFeedbackInfo>(`/image/${id}/collect`, {});
};

export const cancelGenerateImageCollect = async (id: string) => {
  return httpDelete<object, IFeedbackInfo>(`/image/${id}/collect`, {});
};
