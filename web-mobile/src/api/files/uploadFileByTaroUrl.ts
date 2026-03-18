import Taro from '@tarojs/taro'
import { API_URL } from '@/constants'
import type { ApiResponse } from '@/lib/request/http'
import type { UploadImageParams, UploadImageResponse, IUploadProgress } from './uploadFile'
import {getCookie} from "@/util/cookie";

export interface UploadImageByTaroUrlParams {
  filePath: string
  fileType: UploadImageParams['fileType']
  formData?: Record<string, string | number>
  onSuccess?: (res: ApiResponse<UploadImageResponse>) => void
  onFail?: (err: any) => void
}

export const uploadImageByTaroUrl = (
  params: UploadImageByTaroUrlParams,
  handleUploadProgress?: (uploadInfo: IUploadProgress) => void,
): Taro.UploadTask => {
  const task = Taro.uploadFile({
    url: `${API_URL}/file/upload/general`,
    filePath: params.filePath,
    header: {
      Cookie : getCookie()?.replace(/,/g, ";") || ""
    },
    name: 'imageFile',
    formData: { fileType: params.fileType, ...(params.formData || {}) },
    success: (res) => {
      try {
        const data = JSON.parse(res.data as any) as ApiResponse<UploadImageResponse>
        params.onSuccess && params.onSuccess(data)
      } catch (err) {
        params.onFail && params.onFail(err)
      }
    },
    fail: (err) => {
      params.onFail && params.onFail(err)
    },
  })

  if (handleUploadProgress) {
    task.progress((res) => {
      handleUploadProgress({ presentage: res.progress })
    })
  }

  return task
}
