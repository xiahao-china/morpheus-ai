import type { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const'

export interface IHistoryCardInfo {
  taskId: string
  type: EFunctionGroupMode
  defaultImgId: number
  imageUrl: string
  ratioText: string
  title: string
  statusText: string
  desc: string
  timeText: string
}