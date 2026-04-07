import { httpPost } from "@/lib/request/http";

export interface ICollectSquareResponse {
  code: number;
  message: string;
  data: {
    collectCount: number;
    isCollected: boolean;
  };
}

export const collectSquare = async (squareId: string, action?: 'like' | 'unlike') => {
  return httpPost<object, ICollectSquareResponse>(`/square/${squareId}/like`, { action });
};
