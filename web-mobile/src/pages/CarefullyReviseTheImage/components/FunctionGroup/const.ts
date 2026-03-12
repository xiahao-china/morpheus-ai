import {ImageUpscale, Crop, ImagePlus, Images, PencilRuler, Eraser} from '@/components/Icons'

export enum EFunctionGroupMode {
  ONE_KEY_RENDER = 'RENDER', // 一键渲染
  LOCAL_REDRAW = 'REDRAW', // 局部重绘
  INTELLIGENT_CLEAR = 'CLEAN', // 智能清除
  HIGH_DEF_ENLARGE = 'UPSCALE', // 高清放大
  DRAWING = 'DRAWING', // 绘图
  ONE_KEY_CUTOUT = 'CUTOUT', // 一键抠图
  ALL_THINGS_TRANSFER = 'OBJECT_MIGRATION', // 万物迁移
}

export const CHANGE_IMAGE_MODE_LIST = [
  EFunctionGroupMode.ONE_KEY_RENDER,
  EFunctionGroupMode.LOCAL_REDRAW,
  EFunctionGroupMode.INTELLIGENT_CLEAR,
  EFunctionGroupMode.HIGH_DEF_ENLARGE,
  EFunctionGroupMode.ONE_KEY_CUTOUT,
  EFunctionGroupMode.ALL_THINGS_TRANSFER,
];

export interface IFunctionGroupExpose {
  setCurrentMode: (mode: EFunctionGroupMode) => void;
  getCurrentMode: () => EFunctionGroupMode;
}

export const FUNCTION_GROUP_MODE_MAP = {
  [EFunctionGroupMode.ONE_KEY_RENDER]: {
    type: EFunctionGroupMode.ONE_KEY_RENDER,
    icon: ImagePlus,
    label: '一键渲染',
  },
  [EFunctionGroupMode.LOCAL_REDRAW]: {
    type: EFunctionGroupMode.LOCAL_REDRAW,
    icon: PencilRuler,
    label: '局部重绘',
  },
  [EFunctionGroupMode.INTELLIGENT_CLEAR]: {
    type: EFunctionGroupMode.INTELLIGENT_CLEAR,
    icon: Eraser,
    label: '智能清除',
  },
  [EFunctionGroupMode.HIGH_DEF_ENLARGE]: {
    type: EFunctionGroupMode.HIGH_DEF_ENLARGE,
    icon: ImageUpscale,
    label: '高清放大',
  },
  [EFunctionGroupMode.DRAWING]: {
    type: EFunctionGroupMode.DRAWING,
    icon: 'drawing',
    label: '绘图模式',
  },
  [EFunctionGroupMode.ONE_KEY_CUTOUT]: {
    type: EFunctionGroupMode.ONE_KEY_CUTOUT,
    icon: Crop,
    label: '一键抠图',
  },
  [EFunctionGroupMode.ALL_THINGS_TRANSFER]: {
    type: EFunctionGroupMode.ALL_THINGS_TRANSFER,
    icon: Images,
    label: '万物迁移',
  },
}

export const CHANGE_IMG_FUNCTION_GROUP_MODE_MAP = Object.values(FUNCTION_GROUP_MODE_MAP).map((item) => ({
  ...item,
})).filter((item) => CHANGE_IMAGE_MODE_LIST.includes(item.type));
