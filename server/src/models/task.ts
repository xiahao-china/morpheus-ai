import mongoose, { Schema, Document } from 'mongoose';

export enum TaskTypeEnum {
  DAILY_SIGN_IN = 1, // 每日签到
  SHARE_TASK = 2, // 分享任务
  PURCHASE_TASK = 3, // 购买任务
  INVITE_TASK = 4, // 邀请任务
  PROFILE_TASK = 5 // 完善资料任务
}

export interface IActivityTaskConfig extends Document {
  taskName: string; // 任务名称
  taskType: TaskTypeEnum; // 任务类型
  rewardConfig?: string; // 奖励配置
}

const ActivityTaskConfigSchema: Schema = new Schema({
  taskName: { type: String, required: true }, // 任务名称
  taskType: { type: Number, required: true }, // 任务类型
  rewardConfig: { type: String } // 奖励配置
});

export const ActivityTaskConfig = mongoose.model<IActivityTaskConfig>('ActivityTaskConfig', ActivityTaskConfigSchema);

export interface IUserTaskRecord extends Document {
  userId: string; // 用户ID
  taskCode: string; // 任务代码
  completionCount: number; // 完成次数
  status: number; // 状态: 1-进行中, 2-已完成
  updatedTime: Date; // 更新时间
}

const UserTaskRecordSchema: Schema = new Schema({
  userId: { type: String, required: true }, // 用户ID
  taskCode: { type: String, required: true }, // 任务代码
  completionCount: { type: Number, default: 0 }, // 完成次数
  status: { type: Number, default: 1 }, // 状态
  updatedTime: { type: Date, default: Date.now } // 更新时间
});

export const UserTaskRecord = mongoose.model<IUserTaskRecord>('UserTaskRecord', UserTaskRecordSchema);