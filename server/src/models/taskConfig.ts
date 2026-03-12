import mongoose, { Schema, Document } from "mongoose";

export interface ITaskConfig extends Document {
  taskName: string;
  taskType: number; // TaskTypeEnum
  description?: string;
  rewardAmount: number; // Simplified from rewardConfig for now
  status: number; // 1-Enable, 0-Disable
  createdTime: Date;
  updatedTime: Date;
}

const TaskConfigSchema: Schema = new Schema({
  taskName: { type: String, required: true },
  taskType: { type: Number, required: true },
  description: { type: String },
  rewardAmount: { type: Number, default: 0 },
  status: { type: Number, default: 1 },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<ITaskConfig>("TaskConfig", TaskConfigSchema);
