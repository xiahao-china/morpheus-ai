import mongoose, { Schema, Document } from "mongoose";

export interface IPointsRecord extends Document {
  userId: string; // 用户ID
  pointType?: string; // 积分类型
  points: number; // 积分数量
  effectiveTime?: Date; // 生效时间
  expiryDate?: Date; // 过期时间
  level?: string; // 等级
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

const PointsRecordSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true }, // 用户ID
  pointType: { type: String }, // 积分类型
  points: { type: Number, default: 0 }, // 积分数量
  effectiveTime: { type: Date }, // 生效时间
  expiryDate: { type: Date }, // 过期时间
  level: { type: String }, // 等级
  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IPointsRecord>("PointsRecord", PointsRecordSchema);