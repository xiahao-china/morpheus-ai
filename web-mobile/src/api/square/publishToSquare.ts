import { httpPost } from "@/lib/request/http";


export interface IPublishToSquareParams {
  title: string; // 标题
  caption: string; // 内容
  styleTags?: string; // 风格tag，形如 "风格1,风格2,风格3"
  sceneTags?: string; // 场景tag，形如 "场景1,场景2,场景3"
  imageId: number; // 图片id
  drawTaskId?: number; // 绘制任务id
  editedTaskId?: number; // 编辑任务id
}


export const publishToSquare = async (params: IPublishToSquareParams) => {
  return httpPost<IPublishToSquareParams, object>('/square/publish', params);
}
