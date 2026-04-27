import { httpPost } from "@/lib/request/http";

interface IDeleteBatchImageParams {
  imageIds: string[];
}

export const deleteBatchImage = async (params: IDeleteBatchImageParams) => {
  return httpPost<IDeleteBatchImageParams, object>(
    "/images/delete-batch",
    params
  );
};
