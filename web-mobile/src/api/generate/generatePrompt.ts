import { httpPost } from '@/lib/request/http'

export interface IGeneratePromptParams {
  scene: string;
  style: string;
  frontPrompt: string;
}

export type IGeneratePromptResponse = string;

export const generatePrompt = async (params: IGeneratePromptParams) => {
  const qs = new URLSearchParams({
    scene: params.scene,
    style: params.style,
    frontPrompt: params.frontPrompt,
  }).toString();
  return httpPost<IGeneratePromptParams, IGeneratePromptResponse>(`/prompts/generate${qs ? '?' + qs : ''}`, params);
};