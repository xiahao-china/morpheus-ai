import { httpPost } from '@/lib/request/http';

export enum EEditType {
  REDRAW = 'REDRAW',
  CLEAN = 'CLEAN',
  UPSCALE = 'UPSCALE',
  CUTOUT = 'CUTOUT',
  OBJECT_MIGRATION = 'OBJECT_MIGRATION',
}

export enum EDrawingType {
  INSPIRATION = 'INSPIRATION',
  LINEAR_RENDER = 'LINEAR_RENDER',
  RENDER_LY = 'RENDER_LY',
  MAKE_UP = 'MAKE_UP',
  REHABILITATION = 'REHABILITATION',
}

interface IGetQwenImagesTaskParams {
  prompt: string;
  negative_prompt?: string;
  ratio?: string;
  width?: number;
  height?: number;
  count?: number;
  base_images?: string[]; // 底图列表
  type?: EDrawingType, // 前端类型，仅用于兼容，不传给后端
}

interface IGetQwenImagesTaskResponse {
  taskId: string;
  status: string;
  queueId?: string;
}

export const getImagesTask = (params: IGetQwenImagesTaskParams) => {
  return httpPost<IGetQwenImagesTaskParams, IGetQwenImagesTaskResponse>(
    '/image/generate',
    {
      ...params,
      width: params.width || 1024,
      height: params.height || 1024,
      count: params.count || 1,
    }
  );
};

export const getEditedImagesTask = (params: IGetQwenImagesTaskParams) => {
  return httpPost<IGetQwenImagesTaskParams, IGetQwenImagesTaskResponse>(
    '/images/edited/new',
    params,
  );
};

