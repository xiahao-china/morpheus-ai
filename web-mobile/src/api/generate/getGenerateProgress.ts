import { httpGet } from '@/lib/request/http'
import type { GeneratedImageResponse } from '@/api/images/createGenerateTaskStream'

export type GenerateStatus = 'INITIATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface IGenerateProgressResponse {
  value: number
  max: number
  node: string | null
  percent: number
  type: 'TASK_INFO' | 'PROGRESS_INFO'
  status: GenerateStatus
  data: GeneratedImageResponse | null
  generationId: number
  userId: number
  message: string
}

export const getGenerateProgress = async (id: string | number) => {
  return httpGet<object, IGenerateProgressResponse>(`/images/generate/${id}/progress`, {})
}