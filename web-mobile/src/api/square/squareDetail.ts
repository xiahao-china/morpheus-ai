import { httpGet } from "@/lib/request/http";
import type { IGetGenerationHistoryItem } from '@/api/images/getGenerationHistoryDetail'


export interface ISquareDetailResponse {
  id: number;
  userId: number | null;
  username: string;
  title: string;
  caption: string;
  styleTags: string;
  sceneTags: string;
  drawTaskInfo: IGetGenerationHistoryItem;
  editedTaskInfo: IGetGenerationHistoryItem;
  squareImage: {
    id: number,
    fileResourceId: number,
    imageUrl: string;
  },
  publishedTime: string;
  updateTime: string;
  auditStatus: string;
  collectCount: number;
  isCollected: boolean;
  avatar: string;
}


export const getSquareDetail = async (id: string) => {
  return httpGet<object,ISquareDetailResponse>(`/square/${id}`, {});
};
