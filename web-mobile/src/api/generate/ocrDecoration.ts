import { httpPost } from '@/lib/request/http'

export interface IOCRDecorationParams {
  fileId: string;
}

export type IOCRDecorationResponse = 'FINISHED' | 'ROUGHCAST';

export const ocrDecoration = async (params: IOCRDecorationParams) => {
  const qs = new URLSearchParams({ fileId: params.fileId }).toString();
  return httpPost<IOCRDecorationParams, IOCRDecorationResponse>(`/ocr/decoration${qs ? '?' + qs : ''}`, params);
};
