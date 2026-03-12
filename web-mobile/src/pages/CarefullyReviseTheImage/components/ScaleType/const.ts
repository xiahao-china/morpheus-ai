import type { Arrayable } from '@vueuse/core';

export enum EScaleType {
  original = 'ORIGINAL_HD',
  moreDetails = 'MORE_DETAILS',
}

export interface IScaleTypeExpose {
  updateScaleType: (type: EScaleType) => void;
  updateDetailLevel: (level: Arrayable<number>) => void;
  getParams: () => {
    scaleType: EScaleType;
    detailLevel: number | undefined;
  };
}

export const SCALE_TYPE_RADIO_GROUP = [
  {
    label: '原图高清',
    value: EScaleType.original,
  },
  {
    label: '更多细节',
    value: EScaleType.moreDetails,
  },
]
