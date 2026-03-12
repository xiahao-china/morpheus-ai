import type { TFunction } from '@/constants/types';
import {getIsWeb} from "@/util/envCheck";
import Taro from "@tarojs/taro";

export const turnUrlToFile = async (url: string, fileExtension: string): Promise<File> => {
  // 时间戳为fileName
  const fileName = Date.now().toString();
  // 发起网络请求获取 URL 对应的资源
  const response = await fetch(url);
  // 检查响应状态是否正常
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  // 将响应内容转换为 Blob 对象
  const blob = await response.blob();
  // 从 URL 中提取文件扩展名
  // const urlParts = url.split('.');
  // const fileExtension = urlParts.length > 1 ? urlParts.pop()?.toLowerCase() : '';
  // 生成包含扩展名的文件名
  const fullFileName = `${fileName}.${fileExtension || 'unknown'}`;
  return new File([blob], fullFileName, { type: blob.type });
};

/**
 * 压缩图片文件
 * @param file 要压缩的图片文件
 * @param width 压缩后的宽度
 * @param height 压缩后的高度
 * @returns 压缩后的图片文件
 */
export const compressImage = async (file: File, width: number, height: number): Promise<{
  file: File,
  src: string,
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 Canvas 2D 上下文'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, { type: file.type });
          resolve({
            file: compressedFile,
            src: canvas.toDataURL(file.type, 0.8),
          });
        } else {
          reject(new Error('无法将 Canvas 转换为 Blob'));
        }
        URL.revokeObjectURL(img.src);
      }, file.type, 0.8); // 压缩质量设为 0.8
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
      URL.revokeObjectURL(img.src);
    };
  });
};

export const loadImageOriginSize = (url: string):Promise<{
  width:number;
  height:number;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
    img.src = url;
  })
}

// 检查是否为移动端设备
export const isMobileDevice = (): boolean => {
  // 检查 userAgent 中是否包含常见移动端设备标识
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // 检查屏幕宽度是否小于等于 768px window 没有 matchMedia 方法
  const isMobileScreen = window.innerWidth <= 768;
  return isMobileUA || isMobileScreen;
};

// 统一数字转化为字符串
export const turnNumberToString = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else {
    return num.toString();
  }
}

export const isUndefined = (val: any): boolean => {
  return val === undefined;
}

export function once(fn: TFunction) {
  let called = false; // 用来记录函数是否已经被调用过

  return function (...args: any[]) {
    if (!called) {
      called = true;
      return fn(...args);
    }
  };
}

export const throttle = (cb: TFunction, wait = 3000) =>{
  let previous = 0;
  let timerId: NodeJS.Timeout | 0 = 0;

  return (...args: any[]) => {
    const now = +new Date();
    if( now - previous > wait ){
      previous = now;
      cb.apply(this, args);
    } else {
      timerId && clearTimeout(timerId);
      timerId = setTimeout(() => {
        cb.apply(this, args);
        timerId = 0;
      }, wait);
    }
  }
}

export const debounce = (cb: TFunction, wait = 3000) =>{
  let timerId: NodeJS.Timeout | 0 = 0;

  return (...args: any[]) => {
    timerId && clearTimeout(timerId);
    timerId = setTimeout(() => {
      cb.apply(this, args);
    }, wait);
  }
}

export const turnToScreenSizePx = (num?: number): string | undefined => {
  if (isUndefined(num)){
    return undefined;
  }
  const windowInfo = Taro.getWindowInfo();
  if (getIsWeb()){
    const baseSize= windowInfo.screenWidth
    return `${(num as number) * baseSize / 750}px`
  }
  return `${num}rpx`
}
