import { minioClient, BUCKET_NAME, buildObjectPublicUrl } from "@/lib/minio";
import { MINIO_CONFIG } from "@/config";
import FileResource from "@/models/fileResource";
import { sendResponse } from "@/utils/const";
import { buildFilename, buildObjectPath, Context } from "./const";

const buildAccessibleUrl = (ctx: Context, objectPath: string) => {
  const rawUrl = buildObjectPublicUrl(BUCKET_NAME, objectPath);
  if (MINIO_CONFIG.publicBaseUrl) {
    return rawUrl;
  }
  const endpoint = String(MINIO_CONFIG.endPoint || "").toLowerCase();
  const isLoopbackEndpoint = endpoint === "127.0.0.1" || endpoint === "localhost" || endpoint === "::1";
  if (!isLoopbackEndpoint) {
    return rawUrl;
  }
  try {
    const parsed = new URL(rawUrl);
    const requestHost = String(ctx.request?.header?.host || "").trim();
    const requestHostname = requestHost.includes(":") ? requestHost.split(":")[0] : requestHost;
    if (requestHostname && requestHostname !== "127.0.0.1" && requestHostname !== "localhost") {
      parsed.hostname = requestHostname;
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

/**
 * 上传文件到 MinIO
 * 1. 接收文件并存储到 MinIO
 * 2. 生成可直接访问的文件 URL
 * 3. 保存文件信息到数据库
 */
export const uploadFile = async (ctx: Context) => {
  const file = (ctx.request as any).file;
  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }

  const filename = buildFilename(file.originalname);
  await minioClient.putObject(BUCKET_NAME, filename, file.buffer);

  const url = buildAccessibleUrl(ctx, filename);

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

  sendResponse.success(ctx, { filename, url, id: fileResource._id });
};

/**
 * 获取文件访问 URL
 */
export const getFileUrl = async (ctx: Context) => {
    const { filename } = ctx.params;
    const url = buildAccessibleUrl(ctx, filename);
    sendResponse.success(ctx, { url });
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
  const filename = objectName || buildFilename(file.originalname);

  // 按文件类型组织存储路径
  const objectPath = buildObjectPath(fileType, filename);

  await minioClient.putObject(BUCKET_NAME, objectPath, file.buffer);

  const url = buildAccessibleUrl(ctx, objectPath);

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

  sendResponse.success(ctx, {
    fileId: fileResource._id,
    fileName: file.originalname,
    fileUrl: url,
    fileType: fileType,
    downloadName: file.originalname,
    minioPath: objectPath
  });
};
