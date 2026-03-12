import { httpGet, httpPost } from '@/lib/request/http'

export interface IFeedbackInfo{
  id: number;
  userId: number;
  imageId: number;
  imageGenerationId: number;
  isSatisfied: null | boolean;
  isCollected: null | boolean;
  comment: null | string;
  createdTime: string;
  updatedTime: string;
}

export enum ESourceType{
  EDITED = 'EDITED',
  GENERATION = 'GENERATION',
}

// 获取点赞与收藏信息
export const getGenerateImageFeedback = async (id: string, sourceType: ESourceType) => {
  return httpGet<object, IFeedbackInfo>(`/images/interaction/status`, {
    imageId: id,
    sourceType,
  });
};

// 点赞或取消点赞
export const generateImageFeedbackLike = async (id: string, sourceType: ESourceType) => {
  return httpPost(`/images/interaction/satisfied`, {
    imageId: id,
    sourceType,
  })
};

// 点踩或取消踩
export const generateImageFeedbackDislike = async (id: string, sourceType: ESourceType) => {
  return httpPost(`/images/interaction/unsatisfied`, {
    imageId: id,
    sourceType,
  });
};
// 收藏或取消收藏
export const generateImageCollect = async (id: string, sourceType: ESourceType) => {
  return httpPost(`/images/interaction/collect`, {
    imageId: id,
    sourceType,
  })
};
