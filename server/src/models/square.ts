import mongoose, { Schema, Document } from 'mongoose';

export interface ISquare extends Document {
  userId: string; // 用户ID
  imageId: string; // 关联图片ID
  title?: string; // 标题
  caption?: string; // 描述
  styleTags?: string[]; // 风格标签
  sceneTags?: string[]; // 场景标签
  publishedTime: Date; // 发布时间
  viewCount: number; // 浏览数
  likeCount: number; // 点赞数
  collectCount: number; // 收藏数
  imageUrl?: string; // 图片URL
}

const SquareSchema: Schema = new Schema({
  userId: { type: String, required: true }, // 用户ID
  imageId: { type: String, required: true }, // 图片ID
  title: { type: String }, // 标题
  caption: { type: String }, // 描述
  styleTags: [String], // 风格标签
  sceneTags: [String], // 场景标签
  publishedTime: { type: Date, default: Date.now }, // 发布时间
  viewCount: { type: Number, default: 0 }, // 浏览数
  likeCount: { type: Number, default: 0 }, // 点赞数
  collectCount: { type: Number, default: 0 }, // 收藏数
  imageUrl: { type: String } // 图片URL
});

export default mongoose.model<ISquare>('Square', SquareSchema);