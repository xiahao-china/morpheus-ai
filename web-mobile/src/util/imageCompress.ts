import Taro from "@tarojs/taro";
import { getIsWeb } from "@/util/envCheck";

/**
 * 将图片按比例压缩至指定尺寸（默认 1080px）以内
 * @param filePath 图片临时路径
 * @param maxWidth 最大宽度，默认 1080
 * @param maxHeight 最大高度，默认 1080
 * @returns 压缩后的图片路径 (H5 为 base64 或 blob url, 小程序为 tempFilePath)
 */
export const compressImageByDimension = async (
  filePath: string,
  maxWidth: number = 1080,
  maxHeight: number = 1080
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取图片信息
      const imageInfo = await Taro.getImageInfo({ src: filePath });
      const { width: originWidth, height: originHeight } = imageInfo;

      // 2. 计算缩放后的尺寸
      let targetWidth = originWidth;
      let targetHeight = originHeight;

      if (originWidth > maxWidth || originHeight > maxHeight) {
        const ratio = originWidth / originHeight;
        if (originWidth > originHeight) {
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth / ratio);
        } else {
          targetHeight = maxHeight;
          targetWidth = Math.round(maxHeight * ratio);
        }
      } else {
        // 如果尺寸在范围内，直接返回原路径
        return resolve(filePath);
      }

      console.log(`压缩图片: ${originWidth}x${originHeight} -> ${targetWidth}x${targetHeight}`);

      if (getIsWeb()) {
        // H5 环境使用原生 Canvas 压缩，因为 Taro H5 的 Canvas API 可能有限制
        const img = new Image();
        img.src = filePath;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Canvas context not found"));
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          // 导出为 blob url
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, "image/jpeg", 0.8); // 质量设为 0.8
        };
        img.onerror = () => reject(new Error("Image load failed"));
      } else {
        // 小程序环境使用 Taro Canvas (旧版或新版 API)
        // 注意：小程序中 canvas 压缩比较复杂，通常推荐先用 Taro.compressImage
        // 但 Taro.compressImage 不支持修改尺寸。
        // 为了简单且兼容，这里如果是在小程序环境，我们先尝试只用 Taro.compressImage 降低质量
        // 如果非要修改尺寸，小程序需要创建一个离屏 canvas。
        
        // 鉴于目前项目主要是 web-mobile (H5)，我们先保证 H5 的尺寸压缩。
        // 小程序环境下，暂时只做质量压缩，或者后续补充 Canvas 2D 实现。
        try {
          const compressRes = await Taro.compressImage({
            src: filePath,
            quality: 80,
          });
          resolve(compressRes.tempFilePath);
        } catch (e) {
          resolve(filePath); // 失败则返回原图
        }
      }
    } catch (error) {
      console.error("图片压缩失败:", error);
      resolve(filePath); // 出错则返回原图，保证流程不中断
    }
  });
};
