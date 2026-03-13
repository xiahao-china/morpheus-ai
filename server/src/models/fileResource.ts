import mongoose, { Schema, Document } from "mongoose";

export interface IFileResource extends Document {
  filename: string; // 文件名
  originalName: string; // 原始文件名
  mimeType: string; // MIME类型
  size: number; // 文件大小
  path: string; // MinIO路径
  url?: string; // 访问URL(预签名)
  bucket: string; // 存储桶
  userId?: string; // 上传用户ID
  type?: string; // 文件类型分类(如 UNDER_IMAGE)
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

const FileResourceSchema: Schema = new Schema({
  filename: { type: String, required: true }, // 文件名
  originalName: { type: String, required: true }, // 原始文件名
  mimeType: { type: String, required: true }, // MIME类型
  size: { type: Number, required: true }, // 文件大小
  path: { type: String, required: true }, // MinIO路径
  url: { type: String }, // 访问URL
  bucket: { type: String, required: true }, // 存储桶
  userId: { type: String }, // 上传用户ID
  type: { type: String }, // 文件类型
  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IFileResource>("FileResource", FileResourceSchema);