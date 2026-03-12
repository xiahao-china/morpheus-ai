import { Context } from "koa";
import { minioClient, BUCKET_NAME } from "@/lib/minio";

export const uploadFile = async (ctx: Context) => {
  const file = (ctx.request as any).file; 
  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }
  
  const filename = `${Date.now()}-${file.originalname}`;
  await minioClient.putObject(BUCKET_NAME, filename, file.buffer);
  
  const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);
  
  ctx.body = { code: 200, data: { filename, url } };
};

export const getFileUrl = async (ctx: Context) => {
    const { filename } = ctx.params;
    const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);
    ctx.body = { code: 200, data: { url } };
}
