import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const';
import type { ISquareDetailResponse } from '@/api/square/squareDetail';
import type { UserInfo, WorkInfo } from './components/UserAndWorkInfo/const';
import type { IGetGenerationHistoryItem } from '@/api/images/getGenerationHistoryDetail';
import { EScaleType } from '@/pages/CarefullyReviseTheImage/components/ScaleType/const';
import type { IGetChangeGenerationHistoryItem } from '@/api/images/getGenerationChangeImageHistoryDetail';

export interface IHistoryDetailInitProps {
  taskId: string;
  type: EFunctionGroupMode;
  defaultImgId: number;
  onlyOneImage?: boolean; // 仅展示制定图片及其迭代信息
  userInfo?: UserInfo;
  workInfo?: WorkInfo;
}

export interface IHistoryTaskImageInfo {
  id: number;
  fileResourceId: number;
  imageUrl: string;
  isPublishedSquare: boolean;
}

export interface IHistoryTaskInfo {
  id: number; // 广场或普通任务的id
  type: EFunctionGroupMode;
  images: IHistoryTaskImageInfo[];
  underImageUrl: string;
  squareId?: string;
  completedTime?: number | string;

  scene?: string;
  styleModelOutwardName: string;
  prompt: string;
  width: number;
  height: number;
  magnificationOutward?: number;
  enlargeTyped?: EScaleType;
  referImageUrl: string;
  negativePrompt: string;
  modelOutwardName: string;

  originTaskInfo: IGetGenerationHistoryItem;
}

export interface IHistoryDetailExpose {
  showHistoryDetail: (params: IHistoryDetailInitProps) => void;
  showSquareDetail: (params: ISquareDetailResponse, showPublish: boolean) => void;
}

export const handleToHistoryTaskInfo = (
  taskInfo: IGetGenerationHistoryItem | ISquareDetailResponse | IGetChangeGenerationHistoryItem,
  isSquare: boolean,
): IHistoryTaskInfo => {
  if (isSquare) {
    const squareInfo = taskInfo as ISquareDetailResponse;
    const squareTaskInfo = squareInfo.editedTaskInfo || squareInfo.drawTaskInfo || {};
    return {
      id: squareInfo.id,
      squareId: squareInfo.id.toString(),
      type: squareTaskInfo.type ?? EFunctionGroupMode.DRAWING,
      underImageUrl: squareTaskInfo.underImageUrl,
      completedTime: squareTaskInfo.completedTime,
      images: [
        {
          id: squareInfo.squareImage.id,
          fileResourceId: squareInfo.squareImage.fileResourceId,
          imageUrl: squareInfo.squareImage.imageUrl,
          isPublishedSquare: true,
        },
      ],
      scene: squareTaskInfo.scene,
      styleModelOutwardName: squareTaskInfo.styleModelOutwardName,
      prompt: squareTaskInfo.prompt,
      width: squareTaskInfo.width,
      height: squareTaskInfo.height,
      magnificationOutward: squareTaskInfo.magnificationOutward,
      enlargeTyped: squareTaskInfo.enlargeTyped,
      referImageUrl: squareTaskInfo.referImageUrl,
      negativePrompt: squareTaskInfo.negativePrompt,
      modelOutwardName: squareTaskInfo.modelOutwardName,
      originTaskInfo: squareTaskInfo,
    };
  }
  const normalTaskInfo = taskInfo as IGetGenerationHistoryItem;
  return {
    id: normalTaskInfo.id,
    type: normalTaskInfo.type ?? EFunctionGroupMode.DRAWING,
    images: normalTaskInfo.images.map((item) => ({
      id: item.id,
      fileResourceId: item.fileResourceId,
      imageUrl: item.imageUrl,
      isPublishedSquare: item.isPublishedSquare,
    })),
    underImageUrl: normalTaskInfo.underImageUrl,
    completedTime: normalTaskInfo.completedTime,
    scene: normalTaskInfo.scene,
    styleModelOutwardName: normalTaskInfo.styleModelOutwardName,
    prompt: normalTaskInfo.prompt,
    width: normalTaskInfo.width,
    height: normalTaskInfo.height,
    magnificationOutward: normalTaskInfo.magnificationOutward,
    enlargeTyped: normalTaskInfo.enlargeTyped,
    referImageUrl: normalTaskInfo.referImageUrl,
    negativePrompt: normalTaskInfo.negativePrompt,
    modelOutwardName: normalTaskInfo.modelOutwardName,
    originTaskInfo: normalTaskInfo,
  };
};
