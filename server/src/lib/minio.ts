import * as Minio from 'minio';
import { logger } from "./log4js";

const MINIO_CONFIG = {
  endPoint: '127.0.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
};

export const minioClient = new Minio.Client(MINIO_CONFIG);

export const BUCKET_NAME = 'morpheus-ai';

export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`********** MinIO Bucket Created: ${BUCKET_NAME} **********`);
    } else {
      logger.info(`********** MinIO Bucket Exists: ${BUCKET_NAME} **********`);
    }
  } catch (err) {
    logger.error("********** MinIO Error **********\n" + err);
  }
};
