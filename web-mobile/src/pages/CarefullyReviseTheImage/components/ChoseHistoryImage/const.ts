// 功能类型常量定义
import {
  EFunctionGroupMode
} from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const.ts'
import type { IGetGenerationHistoryItem } from '@/api/images/getGenerationHistoryV2.ts'

export interface IFilterOptionsItem {
  label: string;
  value: string;
  disabled?: boolean;
}
// 筛选选项配置
export const FILTER_OPTIONS:IFilterOptionsItem[] = [
  { label: '全部类型', value: '' },
  { label: '绘图', value: EFunctionGroupMode.DRAWING },
  { label: '一键渲染', value: EFunctionGroupMode.ONE_KEY_RENDER },
  { label: '局部重绘', value: EFunctionGroupMode.LOCAL_REDRAW },
  { label: '智能清除', value: EFunctionGroupMode.INTELLIGENT_CLEAR },
  { label: '高清放大', value: EFunctionGroupMode.HIGH_DEF_ENLARGE },
  { label: '一键抠图', value: EFunctionGroupMode.ONE_KEY_CUTOUT },
  { label: '万物迁移', value: EFunctionGroupMode.ALL_THINGS_TRANSFER },
];

export const getFilterOptions = (isGoods: boolean) => {
  if (isGoods) {
    return FILTER_OPTIONS.map((item) => {
      return {
        ...item,
        disabled: item.value !== EFunctionGroupMode.ONE_KEY_CUTOUT,
      }
    })
  }
  return FILTER_OPTIONS
}

export interface IHistoryImage {
  id: string;
  url: string;
  functionType: EFunctionGroupMode;
  extra:{
    taskId: string;
    imageIndex: number;
  }
}

// 组件默认配置
export const DEFAULT_CONFIG = {
  imageWidth: 120,
  imageHeight: 120,
  gridGap: 16,
  popupWidth: 800,
  popupHeight: 500,
};

export interface IChoseHistoryImageProps {
  disabledFunctionType?: EFunctionGroupMode[];
  isGoods?: boolean;
}


export const mergeHistory = (
  curHistory: IHistoryImage[],
  newHistory: IGetGenerationHistoryItem[],
) => {
  const cloneHistory: IHistoryImage[] = [...curHistory]
  newHistory.forEach((item) => {
    const historyImages = item.generatedImages?.length
      ? item.generatedImages
      : (item.editedGeneratedImages ?? [])

    historyImages.forEach((imgItem, index) => {
      const handleImgItem = {
        id: imgItem.fileResourceId.toString(),
        url: imgItem.imageUrl,
        functionType: item.type as EFunctionGroupMode,
        extra: {
          taskId: item.id.toString(),
          imageIndex: index,
        },
      }
      cloneHistory.push(handleImgItem)
    })
  })
  return cloneHistory
}
