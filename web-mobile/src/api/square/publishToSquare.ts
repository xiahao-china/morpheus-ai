import { httpPost } from "@/lib/request/http";


export interface IPublishToSquareParams {
  title: string; // 标题
  caption: string; // 内容
  styleTags?: string[]; // 风格tag数组
  sceneTags?: string[]; // 场景tag数组
  imageId: string; // 图片id
  drawTaskId?: string; // 绘制任务id
  editedTaskId?: string; // 编辑任务id
}


export const publishToSquare = async (params: IPublishToSquareParams) => {
  return httpPost<IPublishToSquareParams, object>('/square/publish', params);
}
