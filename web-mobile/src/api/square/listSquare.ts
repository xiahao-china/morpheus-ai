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
  keyword: string;
  sortBy: string;
  sortOrder?: string;
  pageNo: number;
  pageSize: number;
}

export interface ISquareItem {
  id: string;
  squareImage:{
    fileResourceId: number;
    id: number;
    imageUrl: string;
    scaleThumbnailUrl: string;
    type: string;
    thumbnailUrl: string;
    recordThumbnailUrl: string;
  },
  collectCount: number;
  isCollected: boolean;
  userId: string;
  username: string;
  avatar: string;
  title: string;
}


export interface ISquareListResponse {
  records: ISquareItem[];
  total: number;
  pageNo: number;
  size: number;
  pages: number;
}

export const getSquareList = async (params: ISquareListParams) => {
  console.log(params);
  return httpGet<ISquareListParams,ISquareListResponse>('/square/list', params);
};
