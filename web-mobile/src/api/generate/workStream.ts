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
  negativePrompt?: string;
  ratio?: string;
  width?: number;
  height?: number;
  count?: number;
  promptImageId?: number;
  negativePromptImageId?: number;
  type: EDrawingType,
  underImageId?: string | number;
}

interface IGetQwenImagesTaskResponse {
  id: number;
  userId: number;
  prompt: string;
  promptImageUrl: null;
  underImageUrl: null;
  styleModelOutwardName: null;
  styleExtractionLevelOutward: null;
  ratio: string;
  width: number;
  height: number;
  count: number;
  status: string;
  type: null;
  startedTime: string;
  completedTime: null;
  negativePrompt: string;
  modelOutwardName: string;
  negativePromptImageUrl: null;
  underImageExtractionLevelOutward: null;
  referImageUrl: null;
  referImageExtractionLevelOutward: null;
  images: null;
  modelId: number;
  styleModelId: number | null;
  referImageId: number | null;
  underImageId: number | null;
}

export const getImagesTask = (params: IGetQwenImagesTaskParams) => {
  return httpPost<IGetQwenImagesTaskParams, IGetQwenImagesTaskResponse>(
    '/images/generate/new',
    params,
  );
};

export const getEditedImagesTask = (params: IGetQwenImagesTaskParams) => {
  return httpPost<IGetQwenImagesTaskParams, IGetQwenImagesTaskResponse>(
    '/images/edited/new',
    params,
  );
};

