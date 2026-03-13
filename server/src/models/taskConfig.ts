import mongoose, { Schema, Document } from "mongoose";

export interface ITaskConfig extends Document {
  taskName: string; // 任务名称
  taskType: number; // 任务类型
  description?: string; // 任务描述
  rewardAmount: number; // 奖励数量
  status: number; // 状态: 1-启用, 0-禁用
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

const TaskConfigSchema: Schema = new Schema({
  taskName: { type: String, required: true }, // 任务名称
  taskType: { type: Number, required: true }, // 任务类型
  description: { type: String }, // 任务描述
  rewardAmount: { type: Number, default: 0 }, // 奖励数量
  status: { type: Number, default: 1 }, // 状态
  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<ITaskConfig>("TaskConfig", TaskConfigSchema);