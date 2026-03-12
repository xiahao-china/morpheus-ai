import { Context } from "koa";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import FileResource from "@/models/fileResource";

export const uploadFile = async (ctx: Context) => {
  const file = (ctx.request as any).file; 
  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }
  
  const filename = `${Date.now()}-${file.originalname}`;
  await minioClient.putObject(BUCKET_NAME, filename, file.buffer);
  
  const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);
  
  // Save to DB
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

export const getFileUrl = async (ctx: Context) => {
    const { filename } = ctx.params;
    const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, 24*60*60);
    ctx.body = { code: 200, data: { url } };
}

// General file upload matching ai-design-backend-main
export const uploadGeneralFile = async (ctx: Context) => {
  const file = (ctx.request as any).file;
  const { fileType, objectName } = ctx.request.body as any;
  const user = ctx.state.user as any;

  if (!file) {
      ctx.body = { code: 400, msg: 'No file uploaded' };
      return;
  }

  // Use objectName if provided, otherwise generate one
  const filename = objectName || `${Date.now()}-${file.originalname}`;
  
  // You might want to organize files by type in MinIO
  const objectPath = fileType ? `${fileType.toLowerCase()}/${filename}` : filename;

  await minioClient.putObject(BUCKET_NAME, objectPath, file.buffer);
  
  // Generate presigned URL (valid for 1 day)
  const url = await minioClient.presignedGetObject(BUCKET_NAME, objectPath, 24*60*60);
  
  // Save to DB
  const fileResource = new FileResource({
    filename, // Stored filename
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: objectPath, // MinIO object key
    bucket: BUCKET_NAME,
    url, // Initial presigned URL
    type: fileType,
    userId: user?._id
  });
  await fileResource.save();

  ctx.body = { 
    code: 200, 
    data: { 
      fileId: fileResource._id, // Return DB ID
      fileName: file.originalname,
      fileUrl: url,
      fileType: fileType,
      downloadName: file.originalname,
      minioPath: objectPath
    } 
  };
};
