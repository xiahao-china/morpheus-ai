import { httpGet } from "@/lib/request/http";

/**
 * 请求参数接口定义
 * @interface ISquareListParams
 * @property {string} keyword - 搜索关键词
 * @property {string} sortBy - 排序字段
 * @property {string} sortOrder - 排序方向
 * @property {number} pageNo - 页码
 * @property {number} pageSize - 每页大小
 */
export interface ISquareListParams {
  page: number;
  pageSize: number;
  styleTags?: string;
  sceneTags?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ISquareItem {
  _id: string;
  userId: string;
  imageId: string;
  title: string;
  caption?: string;
  styleTags?: string[];
  sceneTags?: string[];
  publishedTime: string;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  imageUrl?: string;
  username?: string;
  avatar?: string;
}

export interface ISquareListResponse {
  list: ISquareItem[];
  total: number;
}

export const getSquareList = async (params: ISquareListParams) => {
  console.log(params);
  return httpGet<ISquareListParams,ISquareListResponse>('/square/list', params);
};
