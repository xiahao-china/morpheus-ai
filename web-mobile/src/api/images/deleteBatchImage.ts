import { httpPost } from "@/lib/request/http";

interface IDeleteBatchImageParams {
  editedImageIds: string[];
  drawImageIds: string[];
}

export const deleteBatchImage = async (params: IDeleteBatchImageParams) => {
  return httpPost<IDeleteBatchImageParams, object>(
    "/images/delete-batch",
    params
  );
};
