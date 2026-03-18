import { httpGet } from '@/lib/request/http'
import type { GeneratedImageResponse } from '@/api/images/createGenerateTaskStream'

export type GenerateStatus = 'INITIATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface IGenerateProgressResponse {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  imageUrl?: string;
  imageId?: string;
}

export const getGenerateProgress = async (id: string | number) => {
  return httpGet<object, IGenerateProgressResponse>(`/image/detail/${id}`, {})
}