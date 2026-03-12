import { EDrawingType, EEditType } from '@/api/generate/workStream'
import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const'

export interface IGeneratedDetails {
  prompt: string
  ratio?: string
  width?: number
  height?: number
  count: number
  mode?: string
  underImageUrl?: string
}

export const DEFAULT_DETAILS: IGeneratedDetails = {
  prompt: '',
  count: 1,
}

export const MODE_LABEL_MAP: Record<string, string> = {
  [EDrawingType.INSPIRATION]: '灵感生图',
  [EDrawingType.LINEAR_RENDER]: '线稿渲染',
  [EDrawingType.RENDER_LY]: '一键渲染',
  [EDrawingType.MAKE_UP]: '毛坯精装',
  [EDrawingType.REHABILITATION]: '实景改造',

  [EEditType.REDRAW]: '局部重绘',
  [EEditType.CLEAN]: '智能清除',
  [EEditType.UPSCALE]: '高清放大',
  [EEditType.CUTOUT]: '一键抠图',
  [EEditType.OBJECT_MIGRATION]: '万物迁移',

  [EFunctionGroupMode.ONE_KEY_RENDER]: '一键渲染',
  [EFunctionGroupMode.DRAWING]: '绘图模式',
}

export const getModeLabel = (mode?: string): string => {
  if (!mode) return ''
  return MODE_LABEL_MAP[mode] || mode
}

export const getRatioDisplay = (info: Pick<IGeneratedDetails, 'ratio' | 'width' | 'height'>): string => {
  const r = info.ratio
  if (r && r !== '-1' && r !== 'UNKNOWN' && r !== '0') return r
  if (info.width && info.height) return `${info.width}:${info.height}`
  return '1:1'
}
