import { httpPost } from '@/lib/request/http';

interface RunColorParmas {
  frontPrompt: string;
}

export const getRunColor = async (params: RunColorParmas) => {
  const formData = new FormData();
  formData.append('frontPrompt', params.frontPrompt);
  return httpPost<FormData, string>(`/prompts`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
