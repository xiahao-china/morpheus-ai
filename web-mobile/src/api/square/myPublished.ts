import { httpGet } from "@/lib/request/http";

/**
 * 查询当前用户发布的广场记录请求参数
 */
export interface IMyPublishedParams {
  /** 页码，从1开始 */
  pageNo: number;
  /** 每页条数 */
  pageSize: number;
}

/**
 * 广场记录项
 */
export interface ISquareImage {
  id: number;
  fileResourceId: number;
  imageUrl: string;
  scaleThumbnailUrl: string;
}

export interface ISquareRecord {
  id: number;
  userId: number;
  avatar: null;
  username: string;
  collectCount: number;
  isCollected: boolean;
  squareImage: ISquareImage;
  collectedTime?: string;
  publishedTime?: number;
}

/**
 * 分页查询当前用户发布的广场记录响应
 */
export interface IMyPublishedResponse {
  /** 数据列表 */
  records: ISquareRecord[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  size: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 分页查询当前用户发布过的广场记录
 * @param params 查询参数
 * @returns 分页响应对象
 */
export const getMyPublishedRecords = async (params: IMyPublishedParams) => {
  return httpGet<IMyPublishedParams, IMyPublishedResponse>('/square/my-published', params);
};
