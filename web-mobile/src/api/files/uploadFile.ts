import { httpPost } from '@/lib/request/http';

// 上传文件的请求参数结构
export interface UploadImageParams {
  imageFile: File; // 要上传的文件
  fileType:
    | 'UNDER_IMAGE'
    | 'REFER_IMAGE'
    | 'PROMPT_IMAGE'
    | 'NEGATIVE_PROMPT_IMAGE'
    | 'OUTPUT_IMAGE'
    | 'AVATAR_IMAGE'
    | 'MATERIAL_IMAGE'
    | 'MASK_IMAGE'; // 文件类型
}

// 文件上传的响应结构（假设响应包含文件的 ID 和 URL）
export interface UploadImageResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  downloadName: string;
  minioPath: string;
  
  // 兼容旧字段
  url?: string;
  id?: number;
}

export interface IUploadProgress {
  presentage: number;
}

// 上传图片方法
export const uploadImage = async (
  params: UploadImageParams,
  handleUploadProgress?: (uploadInfo: IUploadProgress) => void,
) => {
  const formData = new FormData();
  formData.append('imageFile', params.imageFile);
  formData.append('fileType', params.fileType);

  return httpPost<FormData, UploadImageResponse>('/file/upload/general', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30 * 1000,
    adapter: 'xhr',
    onUploadProgress: (progress) => {
      if (progress.total) {
        const presentage = Math.round((progress.loaded / progress.total) * 100);
        handleUploadProgress?.({ presentage });
      }
    },
  });
};
