import mongoose, { Schema, Document } from "mongoose";

export enum TaskStatusEnum {
  IN_PROGRESS = 0, // 进行中
  COMPLETED = 1,   // 已完成(未领取)
  CLAIMED = 2      // 已领取
}

export interface IUserTaskRecord extends Document {
  userId: string;
  taskCode: string; // 关联 TaskConfig.code
  progress: number; // 当前进度 (e.g., 邀请了2人)
  status: TaskStatusEnum; // 状态
  completionTime?: Date; // 完成时间
  claimTime?: Date; // 领取时间
  createdTime: Date;
  updatedTime: Date;
}

const UserTaskRecordSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  taskCode: { type: String, required: true, index: true },
  progress: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1, 2], default: 0 },
  completionTime: { type: Date },
  claimTime: { type: Date },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

// 复合索引，用于快速查询用户特定任务
UserTaskRecordSchema.index({ userId: 1, taskCode: 1 });

export default mongoose.models.UserTaskRecord || mongoose.model<IUserTaskRecord>("UserTaskRecord", UserTaskRecordSchema);
