import type { IObject } from '@/constants/types.ts';

export const generateImageSizeMax = 1024;
export const generateImageSizeMin = 256;
export const promptMaxLength = 500;

export interface IImageSizeInfo {
  width: number;
  height: number;
  customImageSizeMax?: number;
  customImageSizeMin?: number;
}

export interface IReGenerationInfo {
  width: number;
  height: number;
  underImageUrl?: string;
  referImageUrl?: string;
  underImageReferenceScale?: number;
  referImageReferenceScale?: number;
  referImageId?: number;
  underImageId?: number;

  negativePrompt?: string;
  prompt: string;
  baseModelId: string;
  styleModelId?: string;
  num: number;
  referenceScale: number;
}

export enum ECalcImageLimitRes {
  success = 'success',
  ratioCheckFail = 'ratioCheckFail',
  exceedMinSize = 'exceedMinSize',
  successAutoScale = 'successAutoScale',
}

export const imageLimitTipByRes = {
  [ECalcImageLimitRes.success]: '',
  [ECalcImageLimitRes.ratioCheckFail]: '请上传比例为1:4内尺寸的图片',
  [ECalcImageLimitRes.exceedMinSize]: `请上传最小尺寸大于${generateImageSizeMin}的图片`,
  [ECalcImageLimitRes.successAutoScale]: '图片尺寸超出限制，已自动缩放',
};

export const calcImageLimit = (size: IImageSizeInfo) => {
  const { customImageSizeMax, customImageSizeMin } = size;
  const imageSizeMax = customImageSizeMax || generateImageSizeMax;
  const imageSizeMin = customImageSizeMin || generateImageSizeMin;

  const res = {
    width: 0,
    height: 0,
    resType: ECalcImageLimitRes.success,
    success: true,
  };

  const ratio = size.width / size.height;
  // 比例问题
  if (
    ratio > imageSizeMax / imageSizeMin ||
    ratio < imageSizeMin / imageSizeMax
  ) {
    res.resType = ECalcImageLimitRes.ratioCheckFail;
    res.success = false;
    return res;
  }
  // 最小尺寸问题
  if (size.width < imageSizeMin || size.height < imageSizeMin) {
    res.resType = ECalcImageLimitRes.exceedMinSize;
    res.success = false;
    return res;
  }

  // 超出尺寸自动缩放结果
  if (size.height > imageSizeMax || size.width > imageSizeMax) {
    res.resType = ECalcImageLimitRes.successAutoScale;
  }

  if (size.width > size.height) {
    const calcW = Math.min(Math.max(size.width, imageSizeMin), imageSizeMax);
    res.width = calcW;
    res.height = Math.round(calcW / ratio);
    return res;
  }
  const calcH = Math.min(Math.max(size.height, imageSizeMin), imageSizeMax);

  res.width = Math.round(calcH * ratio);
  res.height = calcH;
  return res;
};

export interface IHandleGenerationInfoByTaskParams extends IObject{
  width: number;
  height: number;
  underImageUrl?: string;
  referImageUrl?: string;
  negativePrompt?: string;
  prompt: string;
  modelId: number;
  styleModelId?: number;
  count: number;
  styleExtractionLevelOutward?: number;
  underImageExtractionLevelOutward?: number;
  referImageExtractionLevelOutward?: number;
  underImageId?: number;
  referImageId?: number;
}

export const handleGenerationInfoByTask = (taskInfo: IHandleGenerationInfoByTaskParams,): IReGenerationInfo => {
  console.log('taskInfo', taskInfo);
  return {
    width: taskInfo.width,
    height: taskInfo.height,
    underImageUrl: taskInfo.underImageUrl,
    referImageUrl: taskInfo.referImageUrl,
    negativePrompt: taskInfo.negativePrompt,
    prompt: taskInfo.prompt,
    baseModelId: taskInfo.modelId?.toString(),
    styleModelId: taskInfo.styleModelId?.toString(),
    num: taskInfo.count,
    referenceScale: taskInfo.styleExtractionLevelOutward || 0.5,
    underImageReferenceScale: taskInfo.underImageExtractionLevelOutward || 0.8,
    referImageReferenceScale: taskInfo.referImageExtractionLevelOutward || 0.8,
    underImageId: taskInfo.underImageId,
    referImageId: taskInfo.referImageId,
  };
};

export const initGenerationInfoByUrlParams = (handleRegenerate: (info: IReGenerationInfo) => void) => {
  // 初始化时获取基础模型列表
  let initData = location.search.replace('?initData=', '');
  initData = decodeURIComponent(initData);
  try {
    if (!initData) return;
    const info = JSON.parse(initData as string) as IReGenerationInfo;
    handleRegenerate(info);
  } catch (error) {
    console.error(error);
  }
}
