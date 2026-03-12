import sketchupPluginObj from '@/lib/sketchUpPlugin'

export interface IGetModelScreenshotResponse {
  isSuccess: boolean;
  imgBase64?: string;
  message: string;
}

export const getModelScreenshot = async () => {
  const data = await sketchupPluginObj.asyncSendMessage({
    path: '/getModelScreenshot',
    data: {},
  });
  return data as IGetModelScreenshotResponse;
}
