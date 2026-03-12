import { httpPost } from "@/lib/request/http";

export interface ICollectSquareResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}

export const collectSquare = async (squareId: string) => {
  return httpPost<object, ICollectSquareResponse>(`/square-collect/${squareId}`, {});
};
