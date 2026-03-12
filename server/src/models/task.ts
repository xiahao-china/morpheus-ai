import mongoose, { Schema, Document } from 'mongoose';

export enum TaskTypeEnum {
  DAILY_SIGN_IN = 1,
  SHARE_TASK = 2,
  PURCHASE_TASK = 3,
  INVITE_TASK = 4,
  PROFILE_TASK = 5
}

export interface IActivityTaskConfig extends Document {
  taskName: string;
  taskType: TaskTypeEnum;
  rewardConfig?: string;
}

const ActivityTaskConfigSchema: Schema = new Schema({
  taskName: { type: String, required: true },
  taskType: { type: Number, required: true },
  rewardConfig: { type: String }
});

export const ActivityTaskConfig = mongoose.model<IActivityTaskConfig>('ActivityTaskConfig', ActivityTaskConfigSchema);

export interface IUserTaskRecord extends Document {
  userId: string;
  taskCode: string;
  completionCount: number;
  status: number; // 1-progress, 2-completed
  updatedTime: Date;
}

const UserTaskRecordSchema: Schema = new Schema({
  userId: { type: String, required: true },
  taskCode: { type: String, required: true },
  completionCount: { type: Number, default: 0 },
  status: { type: Number, default: 1 },
  updatedTime: { type: Date, default: Date.now }
});

export const UserTaskRecord = mongoose.model<IUserTaskRecord>('UserTaskRecord', UserTaskRecordSchema);
