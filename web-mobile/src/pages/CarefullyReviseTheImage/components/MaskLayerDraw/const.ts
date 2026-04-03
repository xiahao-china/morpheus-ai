import { DrawBrush, Lasso, Trash, Undo2, Redo2, Eraser, SquareDashedMousePointer, MousePointerClick } from '@/components/Icons'
import type { Ref } from 'vue'
import { cloneDeep } from '@/util/cloneDeep.ts';
import { once } from '@/constants/util.ts';
import { uploadImage } from '@/api/files/uploadFile.ts'
import { turnUrlToFile } from '@/constants/util.ts'
import type { IObject } from '@/constants/types.ts';

export interface IMaskLayerDrawProps {
  width: number;
  height: number;
  imgUrl: string;
}

export interface IMaskImageInfo {
  id: string;
  url: string;
  loading: boolean;
  tipText?: string;
}

export const DEFAULT_MASK_IMAGE_INFO: IMaskImageInfo = {
  id: '',
  url: '',
  loading: false,
}

export enum EMaskLayerDrawType {
  SELECT = 'select', // 选择
  BORDER_SELECT = 'borderSelect', // 一键边缘选取
  SMUDGE = 'smudge', // 涂抹
  LASSO = 'lasso', // 套索
  LASSO_ERASER = 'lassoEraser', // 套索减选
  ERASER = 'eraser', // 橡皮
  CLEAR = 'clear', // 清除
  UNDO = 'undo', // 撤销
  REDO = 'redo', // 恢复

}

export const MASK_LAYER_DRAW_OPTIONS = [
  {
    type: EMaskLayerDrawType.SELECT,
    icon: SquareDashedMousePointer,
    label: '选择',
    tip: '选择已经涂抹区域',
    hidden: true,
  },
  {
    type: EMaskLayerDrawType.BORDER_SELECT,
    icon: MousePointerClick,
    label: '一键选取',
    tip: '识别物体边缘快速选取',
  },
  {
    type: EMaskLayerDrawType.SMUDGE,
    icon: DrawBrush,
    label: '涂抹',
    tip: '使用画笔进行涂抹',
    needSize: true,
  },
  {
    type: EMaskLayerDrawType.LASSO,
    icon: Lasso,
    label: '套索',
    tip: '使用套索进行选择',
  },
  {
    type: EMaskLayerDrawType.LASSO_ERASER,
    icon: Lasso,
    label: '套索减选',
    tip: '使用套索进行擦除',
  },
  {
    type: EMaskLayerDrawType.ERASER,
    icon: Eraser,
    label: '橡皮擦',
    tip: '使用橡皮擦进行擦除',
    needSize: true,
  },
  {
    type: EMaskLayerDrawType.CLEAR,
    icon: Trash,
    label: '清除',
    tip: '清除所有内容',
  },
  {
    type: EMaskLayerDrawType.UNDO,
    icon: Undo2,
    label: '撤销',
    tip: '撤销上一步操作',
  },
  {
    type: EMaskLayerDrawType.REDO,
    icon: Redo2,
    label: '恢复',
    tip: '恢复上一步操作',
  },
]

export const addShortcutKeys = (handleDrawType: (type: EMaskLayerDrawType) => void) => {
  document.addEventListener('keydown', (e) => {
    // 添加删除，撤销，恢复快捷键
    if (e.key === 'Delete') {
      handleDrawType(EMaskLayerDrawType.CLEAR)
    }
    if (e.key === 'z' && e.ctrlKey) {
      handleDrawType(EMaskLayerDrawType.UNDO)
    }
    if (e.key === 'y' && e.ctrlKey) {
      handleDrawType(EMaskLayerDrawType.REDO)
    }
    if (e.key === 'd' && e.ctrlKey) {
      handleDrawType(EMaskLayerDrawType.CLEAR)
    }
  })
}

// 为保持环境一致，将构建后的产物Fabric.js放入lib文件夹
export const loadFabric = once(async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = new URL('@/lib/fabric/fabric.min.js', import.meta.url).href;
    script.onload = ()=>{
      resolve();
    }
    script.onerror = reject;
    document.head.appendChild(script);
  });
});

export interface IMaskLayerDrawExposed {
  validateHistory: () => boolean
  uploadCanvasAsImage: ()=> Promise<string | undefined | null>;
  getMaskImageInfo: () => IMaskImageInfo;
  reloadComponent: () => void;
}


// 擦除图片非黑色部分，入参base64图片, 返回base64图片
export const eraserImage = async (base64Image: string) => {
  return new Promise<string>((resolve, reject) => {
    // 创建一个 Image 对象
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      // 创建一个 Canvas 元素
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取 Canvas 2D 上下文'));
        return;
      }

      // 将图片绘制到 Canvas 上
      ctx.drawImage(img, 0, 0);

      // 获取 Canvas 的像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 遍历每个像素
      for (let i = 0; i < data.length; i += 4) {
        // 检查是否为非黑色像素
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
          data[i] = 255; // 红色
          data[i + 1] = 0; // 绿色
          data[i + 2] = 0; // 蓝色
          data[i + 3] = 255; // 透明度
        }
      }

      // 将修改后的像素数据放回 Canvas
      ctx.putImageData(imageData, 0, 0);

      // 将 Canvas 转换为 base64 图片
      const resultBase64 = canvas.toDataURL('image/png');
      resolve(resultBase64);
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
  });
};



export const turnCanvasToImageAndUpload = async (maskCanvas: IObject, uploadInfo: Ref<IMaskImageInfo>) => {
  // 将 canvas 转为图片数据
  uploadInfo.value.loading = true
  const canvasDataURL = maskCanvas.toDataURL({
    format: 'png',
    quality: 1
  });
  uploadInfo.value.url = await eraserImage(canvasDataURL);
  console.log('canvasDataURL',uploadInfo.value.url);
  const file = await turnUrlToFile(uploadInfo.value.url, 'png');
  console.log('file',file);
  // 将 dataURL 转为 Blob 对象
  const config = {
    imageFile: file,
    fileType: 'MASK_IMAGE' as const
  };
  const res = await uploadImage(config);
  uploadInfo.value.loading = false;
  // 检查返回的 code 和 msg
  if (res instanceof Error || res.code !== 200) {
    console.error('图片上传失败:', res);
    return;
  }

  const uploadedId = res.data.id?.toString() || res.data.fileId;
  if (!uploadedId) {
    return;
  }
  uploadInfo.value.id = uploadedId;
  return uploadedId;
};


export const DEFAULT_BRUSH_LIMIT_SIZE_RANGE = {
  min: 1,
  max: 100,
  step: 1,
}
export const calcBrushMaxSizeRange = (imageWidth: number) => {
  const baseSize = 1024;
  const baseBrushLimitSizeRange = cloneDeep(DEFAULT_BRUSH_LIMIT_SIZE_RANGE);
  const ratio = imageWidth / baseSize;
  return {
    min: Math.ceil(ratio * baseBrushLimitSizeRange.min),
    max: Math.ceil(ratio * baseBrushLimitSizeRange.max),
    step: Math.ceil(ratio * baseBrushLimitSizeRange.step),
  }
}


export const drawCircleToBase64 = (size: number, strokeWidth: number = 2, strokeColor: string = 'white'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文');
  }

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - strokeWidth / 2, 0, 2 * Math.PI);
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
  ctx.closePath();

  return canvas.toDataURL('image/png');
};
