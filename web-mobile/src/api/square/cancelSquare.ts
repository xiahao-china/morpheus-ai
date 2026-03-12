import { httpDelete } from "@/lib/request/http";

export interface ICancelSquareResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}

export const cancelSquare = async (id: string) => {
  return httpDelete<object,ICancelSquareResponse>(`/square/${id}`,{});
};
