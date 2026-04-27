import { httpDelete } from "@/lib/request/http";

export const deleteSquareRecord = async (squareId: string | number) => {
  return httpDelete<object, object>(`/square/${squareId}`, {});
};