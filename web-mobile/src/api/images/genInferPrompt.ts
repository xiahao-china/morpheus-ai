import { httpPost } from "@/lib/request/http";

// 上传文件的请求参数结构
interface InferPromptParams {
  imageFile: File; // 要上传的文件
  fileType: 'PROMPT_IMAGE' | 'NEGATIVE_PROMPT_IMAGE'; // 文件类型
}

interface InferPromptResponse {
  id: number;
  text: string;
}


export const genInferPrompt = async (params: InferPromptParams) => {
  const formData = new FormData();
  formData.append('imageFile', params.imageFile);
  formData.append('fileType', params.fileType);

  return httpPost<FormData, InferPromptResponse>('/images/prompt/infer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
