import { httpGet } from "@/lib/request/http";

export interface StyleModelRecord {
  id: number;
  value: string;
  iconUrl: string;
  type: string;
  defaultValue: string;
  isEnabled: boolean;
}

interface StyleModelRequest {
  pageNo?: number;
  pageSize?: number;
}

interface StyleModelResponse {
  records: StyleModelRecord[];
  total: number;
  size: number;
  current: number;
  orders: unknown[];
  optimizeCountSql: boolean;
  searchCount: boolean;
  optimizeJoinOfCountSql: boolean;
  maxLimit: null | number;
  countId: null | string | number;
  pages: number;
}


export const getStyleModels = async (params: StyleModelRequest) => {
  return httpGet<StyleModelRequest, StyleModelResponse>('/system/config/style', params)
}

export const getStyleModelById = async (id: number, params: StyleModelRequest) => {
  return httpGet<StyleModelRequest, StyleModelResponse>(`/system/config/style/${id}`, params)
}

export const getChangeImageModelStyleModel = async (concreteSceneId:number,params: StyleModelRequest) => {
  return httpGet<StyleModelRequest, StyleModelResponse>(`/system/config/style/concrete-scene-id/${concreteSceneId}`, params)
}
