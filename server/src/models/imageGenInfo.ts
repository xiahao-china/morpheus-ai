import mongoose, { Schema, Document } from "mongoose";

export interface IImageGenInfo extends Document {
  userId?: string; // 关联用户
  imageGenTaskId: string; // 关联生成任务ID
  fileResourceId: string; // 关联文件资源ID
  imageUrl: string; // 图片URL
  width: number; // 宽度
  height: number; // 高度

  // 反馈
  isLiked: boolean; // 点赞状态: true-点赞, false-未点赞

  // 广场发布状态
  isPublishedToSquare?: boolean; // 是否已发布到广场

  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

const ImageGenInfoSchema: Schema = new Schema({
  userId: { type: String }, // 用户ID
  imageGenTaskId: { type: String, required: true }, // 生成任务ID
  fileResourceId: { type: String, required: true }, // 文件资源ID
  imageUrl: { type: String, required: true }, // 图片URL
  width: { type: Number }, // 宽度
  height: { type: Number }, // 高度

  isLiked: { type: Boolean, default: false }, // 点赞状态

  isPublishedToSquare: { type: Boolean, default: false }, // 是否已发布到广场

  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IImageGenInfo>("ImageGenInfo", ImageGenInfoSchema);
