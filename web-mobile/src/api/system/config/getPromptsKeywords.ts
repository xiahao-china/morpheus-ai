import { httpGet } from "@/lib/request/http"

export enum EGlossaryType {
  PUBLIC = 'PUBLIC_DECORATION', // 公装设计
  HOME = 'HOME_DECORATION', // 家装设计
}


export interface IGetPromptsKeywordsItem{
  description: string;
  singleChoice?: boolean;
  promptLabelName: string[];
}



export const getPromptsKeywords = async (scene: EGlossaryType) => {
  return httpGet<object, IGetPromptsKeywordsItem[]>(`/system/config/keywords/${scene}`, {})
}
