import mongoose, { Schema, Document } from "mongoose";

export enum TaskStatusEnum {
  INITIATED = 'INITIATED', // 初始化
  PENDING = 'PENDING', // 等待中
  PROCESSING = 'PROCESSING', // 处理中
  COMPLETED = 'COMPLETED', // 已完成
  CANCEL = 'CANCEL', // 取消
  FAILED = 'FAILED' // 失败
}

export enum TaskProviderEnum {
  COMFYUI = 'COMFYUI',
  THIRD_PARTY = 'THIRD_PARTY'
}

export enum ImageActionModeEnum {
  DRAWING = 'DRAWING', // 绘图模式
  RENDER = 'RENDER', // 旧_渲染模式
  INSPIRATION = 'INSPIRATION', // 灵感生图
  MAKE_UP = 'MAKE_UP', // 毛坯精装
  REHABILITATION = 'REHABILITATION', // 实景改造
  RENDER_LY = 'RENDER_LY', // 一键渲染
  LINEAR_RENDER = 'LINEAR_RENDER', // 线性渲染
  HOME_MIGRATION = 'HOME_MIGRATION', // 家具植入
  REDRAW = 'REDRAW', // 局部重绘
  CLEAN = 'CLEAN', // 智能清除
  UPSCALE = 'UPSCALE', // 高清放大
  CUTOUT = 'CUTOUT', // 一键抠图
  OBJECT_MIGRATION = 'OBJECT_MIGRATION' // 万物迁移
}

// Input Image Config
const InputImageConfigSchema = new Schema({
  id: { type: String },
  url: { type: String },
  name: { type: String },
  extractionLevel: { type: Number },
  extractionLevelOutward: { type: Number },
  width: { type: Number },
  height: { type: Number }
}, { _id: false });

// Generation Params
const GenerationParamsSchema = new Schema({
  // Basic
  prompt: { type: String, required: true },
  negativePrompt: { type: String },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  ratio: { type: String },
  count: { type: Number, default: 1 },
  promptUsage: { type: String },

  // Model
  model: { type: String },
  modelId: { type: String },
  modelOutwardName: { type: String },
  
  styleModel: { type: String },
  styleModelId: { type: String },
  styleModelOutwardName: { type: String },
  styleExtractionLevel: { type: Number },
  styleExtractionLevelOutward: { type: Number },

  // Images
  promptImage: InputImageConfigSchema,
  negativePromptImage: InputImageConfigSchema,
  underImage: InputImageConfigSchema,
  referImage: InputImageConfigSchema,
  baseImages: [{ type: String }] // Array of base image IDs
}, { _id: false });

// ComfyUI Config
const ComfyUIConfigSchema = new Schema({
  workflowJson: { type: String },
  workflowName: { type: String },
  promptId: { type: String },
  clientId: { type: String },
  seed: { type: Number }
}, { _id: false });

export interface IImageGenTask extends Document {
  userId: string;
  status: TaskStatusEnum;
  type?: ImageActionModeEnum;
  provider?: TaskProviderEnum;
  params: any; // GenerationParams
  comfyui: any; // ComfyUIConfig
  
  createdTime: Date;
  updatedTime: Date;
  startedTime?: Date;
  completedTime?: Date;
}

const ImageGenTaskSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.PENDING, index: true },
  type: { type: String, enum: Object.values(ImageActionModeEnum) },
  provider: { type: String, enum: Object.values(TaskProviderEnum), default: TaskProviderEnum.COMFYUI },
  
  params: GenerationParamsSchema,
  comfyui: ComfyUIConfigSchema,

  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now },
  startedTime: { type: Date },
  completedTime: { type: Date }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IImageGenTask>("ImageGenTask", ImageGenTaskSchema);
