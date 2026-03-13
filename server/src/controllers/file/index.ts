import { Context } from "koa";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import FileResource from "@/models/fileResource";

/**
 * 上传文件到 MinIO
 * 1. 接收文件并存储到 MinIO
 * 2. 生成预签名访问 URL
 * 3. 保存文件信息到数据库
 */
export const uploadFile = async (ctx: Context) => {
  const file = (ctx.request as any).file;
  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }

  const filename = `${Date.now()}-${file.originalname}`;
  await minioClient.putObject(BUCKET_NAME, filename, file.buffer);

  // 生成预签名 URL，有效期 24 小时
  const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);

  // 保存到数据库
  const fileResource = new FileResource({
    filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: filename,
    bucket: BUCKET_NAME,
    url,
    userId: (ctx.state.user as any)?._id
  });
  await fileResource.save();

  ctx.body = { code: 200, data: { filename, url, id: fileResource._id } };
};

/**
 * 获取文件访问 URL
 */
export const getFileUrl = async (ctx: Context) => {
    const { filename } = ctx.params;
    const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);
    ctx.body = { code: 200, data: { url } };
}

/**
 * 通用文件上传（支持指定文件类型和对象名）
 */
export const uploadGeneralFile = async (ctx: Context) => {
  const file = (ctx.request as any).file;
  const { fileType, objectName } = ctx.request.body as any;
  const user = ctx.state.user as any;

  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }

  // 使用指定的对象名或生成新的
  const filename = objectName || `${Date.now()}-${file.originalname}`;

  // 按文件类型组织存储路径
  const objectPath = fileType ? `${fileType.toLowerCase()}/${filename}` : filename;

  await minioClient.putObject(BUCKET_NAME, objectPath, file.buffer);

  // 生成预签名 URL
  const url = await minioClient.presignedGetObject(BUCKET_NAME, objectPath, 24*60*60);

  // 保存到数据库
  const fileResource = new FileResource({
    filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: objectPath,
    bucket: BUCKET_NAME,
    url,
    type: fileType,
    userId: user?._id
  });
  await fileResource.save();

  ctx.body = {
    code: 200,
    data: {
      fileId: fileResource._id,
      fileName: file.originalname,
      fileUrl: url,
      fileType: fileType,
      downloadName: file.originalname,
      minioPath: objectPath
    }
  };
};