import sharp from 'sharp';
import { minioClient, BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";

export interface CompressedImageInfo {
  size: number;
  path: string;
  url: string;
}

export interface CompressedImages {
  size128?: CompressedImageInfo;
  size256?: CompressedImageInfo;
  size512?: CompressedImageInfo;
}

/**
 * 压缩图片为指定长边尺寸并上传到 MinIO
 */
const compressAndUpload = async (
  buffer: Buffer,
  baseFilename: string,
  longEdge: number
): Promise<CompressedImageInfo | undefined> => {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // 如果无法获取元数据，可能不是图片，跳过压缩
    if (!metadata.width || !metadata.height) {
      return undefined;
    }

    // 只有当原图大于目标尺寸时才压缩
    if (Math.max(metadata.width, metadata.height) > longEdge) {
      const resizedBuffer = await image
        .resize({
          width: longEdge,
          height: longEdge,
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      // 构建压缩后的文件名，如: filename_128.jpg
      const extMatch = baseFilename.match(/(\.[^.]+)$/);
      const ext = extMatch ? extMatch[1] : '';
      const nameWithoutExt = extMatch ? baseFilename.slice(0, -ext.length) : baseFilename;
      const compressFilename = `${nameWithoutExt}_${longEdge}${ext || '.webp'}`;

      await minioClient.putObject(BUCKET_NAME, compressFilename, resizedBuffer);
      const url = buildObjectPublicUrl(BUCKET_NAME, compressFilename);

      return {
        size: resizedBuffer.length,
        path: compressFilename,
        url
      };
    } else {
      // 如果原图已经小于等于目标尺寸，直接复制原图作为该尺寸的版本
      const compressFilename = (() => {
        const extMatch = baseFilename.match(/(\.[^.]+)$/);
        const ext = extMatch ? extMatch[1] : '';
        const nameWithoutExt = extMatch ? baseFilename.slice(0, -ext.length) : baseFilename;
        return `${nameWithoutExt}_${longEdge}${ext || '.webp'}`;
      })();

      await minioClient.putObject(BUCKET_NAME, compressFilename, buffer);
      const url = buildObjectPublicUrl(BUCKET_NAME, compressFilename);

      return {
        size: buffer.length,
        path: compressFilename,
        url
      };
    }
  } catch (error) {
    console.error(`[Image Compression] Failed to compress image to ${longEdge}:`, error);
    return undefined;
  }
};

/**
 * 压缩图片并上传到MinIO，返回不同尺寸的信息
 */
export const processAndUploadCompressedImages = async (
  buffer: Buffer,
  baseFilename: string
): Promise<CompressedImages> => {
  const [size128, size256, size512] = await Promise.all([
    compressAndUpload(buffer, baseFilename, 128),
    compressAndUpload(buffer, baseFilename, 256),
    compressAndUpload(buffer, baseFilename, 512)
  ]);

  return { size128, size256, size512 };
};
