import { httpGet } from "@/lib/request/http";
import type { ISquareRecord } from "@/api/square/myPublished";

export interface ISquareItem extends ISquareRecord {
  squareId: number;
}

export interface IGetMyCollectionsResponse {
  total: number;
  records: ISquareItem[];
}

export interface IGetMyCollectionsParams {
  pageNo: number;
  pageSize: number;
}

export const getMyCollections = async (params: IGetMyCollectionsParams) => {
  return httpGet<IGetMyCollectionsParams, IGetMyCollectionsResponse>(
    "/square/collections",
    params
  );
};
