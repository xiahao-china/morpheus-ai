// 放大倍率枚举
export enum EEnlargeMode {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
}

// 放大倍率选项列表
export const ENLARGE_MODE_RADIO_GROUP = [
  {
    label: '2x',
    value: EEnlargeMode.TWO,
  },
  {
    label: '3x',
    value: EEnlargeMode.THREE,
  },
  {
    label: '4x',
    value: EEnlargeMode.FOUR,
  },
]

export interface IResolutionSettingExpose {
  getSelectedScale: () => EEnlargeMode;
  updateScale: (scale?: EEnlargeMode) => void;
}
