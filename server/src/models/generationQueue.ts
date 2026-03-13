import mongoose, { Schema, Document } from "mongoose";

export interface IGenerationQueue extends Document {
  taskId: string; // 关联任务ID
  userId: string; // 用户ID
  status: string; // 队列状态: queued-排队中, processing-处理中, completed-已完成, failed-失败
  provider?: string; // 服务提供商: COMFYUI 或 THIRD_PARTY
  priority: number; // 优先级(越高越先处理)
  progress: number; // 进度百分比(0-100)
  payload: any; // 任务数据(提示词、模型、参数等)
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  startedAt?: Date; // 开始时间
  completedAt?: Date; // 完成时间
  error?: string; // 错误信息
  sseId?: string; // SSE ID用于实时进度更新
}

const GenerationQueueSchema: Schema = new Schema({
  taskId: { type: String, required: true, unique: true }, // 任务ID
  userId: { type: String, required: true }, // 用户ID
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' }, // 队列状态
  provider: { type: String, default: 'COMFYUI' }, // 服务提供商
  priority: { type: Number, default: 0 }, // 优先级
  progress: { type: Number, default: 0 }, // 进度
  payload: { type: Schema.Types.Mixed }, // 任务数据
  createdAt: { type: Date, default: Date.now }, // 创建时间
  updatedAt: { type: Date, default: Date.now }, // 更新时间
  startedAt: { type: Date }, // 开始时间
  completedAt: { type: Date }, // 完成时间
  error: { type: String }, // 错误信息
  sseId: { type: String } // SSE ID
}, {
  timestamps: true
});

// 队列处理索引
GenerationQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
GenerationQueueSchema.index({ status: 1, provider: 1, priority: -1, createdAt: 1 });

export default mongoose.model<IGenerationQueue>("GenerationQueue", GenerationQueueSchema);