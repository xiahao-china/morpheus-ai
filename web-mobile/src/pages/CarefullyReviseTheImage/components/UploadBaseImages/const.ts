// 最大图片大小为 10MB
export const MAX_IMAGE_SIZE = 1024 * 1024 * 10;

// 最大图片为 2k
export const MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE = 1024 * 2;

export interface IUploadImageInfo {
  url: string;
  id: string;
  width: number;
  height: number;
  imageOriginWidth:number;
  imageOriginHeight:number;
  originTaskId?: string;
}

export const DEFAULT_UPLOAD_IMAGE_INFO: IUploadImageInfo = {
  url: '',
  id: '',
  width: 0,
  height: 0,
  imageOriginWidth: 0,
  imageOriginHeight: 0,
  originTaskId: '',
}

export interface IUploadBaseImagesExpose {
  validateImage: () => boolean;
  getCurrentImage: () => IUploadImageInfo;
  updateImage: (image: IUploadImageInfo) => void;
}

export interface IUploadImageProps {
  // 隐藏压缩提示
  hideCompressTip?: boolean;
  // 标题
  title?: string;
  // 是物体
  isGoods?: boolean;
}

// 根据图片url获取图片链接转为File
export const getImageUrlToFile = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], 'image.png', { type: 'image/png' });
}

// 将base64转为file文件以上传
export const turnBase64ToImageFile = (base64Image: string, filename = 'image') => {

  // 转换为二进制
  const bstr = atob(base64Image);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  // 根据 mime 自动生成扩展名
  const ext = 'png';

  // 返回 File 对象
  return new File([u8arr], `${filename}.${ext}`, { type: 'image/png' });
};
