import { httpGet } from "@/lib/request/http";

export interface BaseModelRecord {
  id: number;
  value: string;
  iconUrl?: string;
  type?: string;
  defaultValue?: string;
  isEnabled: boolean;
  remark?: string;
}

interface BaseModelRequest {
  pageNo?: number;
  pageSize?: number;
}

interface BaseModelResponse {
  records: BaseModelRecord[];
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


export const getBaseModels = async (params: BaseModelRequest) => {
  return httpGet<BaseModelRequest, BaseModelResponse>('/system/config/base', params)
}
