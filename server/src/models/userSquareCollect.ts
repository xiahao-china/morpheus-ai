import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSquareCollect extends Document {
  userId: string; // 用户ID
  squareId: string; // 广场作品ID
  createdTime: Date; // 收藏时间
}

const UserSquareCollectSchema: Schema = new Schema({
  userId: { type: String, required: true },
  squareId: { type: String, required: true },
  createdTime: { type: Date, default: Date.now },
});

// 为用户ID和广场ID创建联合唯一索引，防止重复收藏
UserSquareCollectSchema.index({ userId: 1, squareId: 1 }, { unique: true });

export default mongoose.model<IUserSquareCollect>('UserSquareCollect', UserSquareCollectSchema);
