/**
 * MinIO 对象存储客户端模块
 * 使用 MinIO SDK 连接对象存储服务（兼容AWS S3）
 */
import * as Minio from 'minio';
import { logger } from "./log4js";
import { MINIO_CONFIG, MINIO_BUCKET_NAME } from "@/config/index";

/**
 * MinIO 客户端实例
 * 使用配置文件中定义的参数创建客户端
 */
export const minioClient = new Minio.Client(MINIO_CONFIG);

/**
 * 存储桶名称
 * 所有文件都将存储在此 bucket 中
 */
export const BUCKET_NAME = MINIO_BUCKET_NAME;

export const buildObjectPublicUrl = (bucket: string, objectPath: string) => {
  const endpoint = String(MINIO_CONFIG.publicBaseUrl || MINIO_CONFIG.endPoint || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/g, "");
  const useSSL = Boolean(MINIO_CONFIG.useSSL);
  const protocol = useSSL ? "https" : "http";
  const port = Number(MINIO_CONFIG.port);
  const defaultPort = useSSL ? 443 : 80;
  const host = port && port !== defaultPort ? `${endpoint}:${port}` : endpoint;
  const normalizedPath = objectPath
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${protocol}://${host}/${encodeURIComponent(bucket)}/${normalizedPath}`;
};

/**
 * 初始化 MinIO 存储桶
 * 检查存储桶是否存在，不存在则创建
 * 应该在应用启动时调用一次
 *
 * @example
 * import { initMinio } from '@/lib/minio';
 * await initMinio();
 */
export const initMinio = async () => {
  try {
    // 检查存储桶是否存在
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      // 创建新的存储桶
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`********** MinIO Bucket Created: ${BUCKET_NAME} **********`);
    } else {
      logger.info(`********** MinIO Bucket Exists: ${BUCKET_NAME} **********`);
    }
    await minioClient.setBucketPolicy(
      BUCKET_NAME,
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      }),
    );
  } catch (err) {
    logger.error("********** MinIO Error **********\n" + err);
  }
};
