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
  COMFYUI = 'COMFYUI', // ComfyUI
  THIRD_PARTY = 'THIRD_PARTY' // 第三方
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

// 输入图片配置
const InputImageConfigSchema = new Schema({
  id: { type: String }, // 图片ID
  url: { type: String }, // 图片URL
  name: { type: String }, // 图片名称
  extractionLevel: { type: Number }, // 提取等级
  extractionLevelOutward: { type: Number }, // 外部提取等级
  width: { type: Number }, // 宽度
  height: { type: Number } // 高度
}, { _id: false });

// 生成参数
const GenerationParamsSchema = new Schema({
  // 基础参数
  prompt: { type: String, required: true }, // 提示词
  negativePrompt: { type: String }, // 负面提示词
  width: { type: Number, required: true }, // 宽度
  height: { type: Number, required: true }, // 高度
  ratio: { type: String }, // 比例
  count: { type: Number, default: 1 }, // 生成数量
  promptUsage: { type: String }, // 提示词用途

  // 模型参数
  model: { type: String }, // 模型
  modelId: { type: String }, // 模型ID
  modelOutwardName: { type: String }, // 外部模型名称

  styleModel: { type: String }, // 风格模型
  styleModelId: { type: String }, // 风格模型ID
  styleModelOutwardName: { type: String }, // 外部风格模型名称
  styleExtractionLevel: { type: Number }, // 风格提取等级
  styleExtractionLevelOutward: { type: Number }, // 外部风格提取等级

  // 图片参数
  promptImage: InputImageConfigSchema, // 提示词图片
  negativePromptImage: InputImageConfigSchema, // 负面提示词图片
  underImage: InputImageConfigSchema, // 底图
  referImage: InputImageConfigSchema, // 参考图
  baseImages: [{ type: String }] // 基础图片ID数组
}, { _id: false });

// ComfyUI 配置
const ComfyUIConfigSchema = new Schema({
  workflowJson: { type: String }, // 工作流JSON
  workflowName: { type: String }, // 工作流名称
  promptId: { type: String }, // 提示词ID
  clientId: { type: String }, // 客户端ID
  seed: { type: Number } // 随机种子
}, { _id: false });

export interface IImageGenTask extends Document {
  userId: string; // 用户ID
  status: TaskStatusEnum; // 任务状态
  type?: ImageActionModeEnum; // 图片操作模式
  provider?: TaskProviderEnum; // 服务提供商
  params: any; // 生成参数
  comfyui: any; // ComfyUI配置

  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  startedTime?: Date; // 开始时间
  completedTime?: Date; // 完成时间
}

const ImageGenTaskSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true }, // 用户ID
  status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.PENDING, index: true }, // 任务状态
  type: { type: String, enum: Object.values(ImageActionModeEnum) }, // 图片操作模式
  provider: { type: String, enum: Object.values(TaskProviderEnum), default: TaskProviderEnum.COMFYUI }, // 服务提供商

  params: GenerationParamsSchema, // 生成参数
  comfyui: ComfyUIConfigSchema, // ComfyUI配置

  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now }, // 更新时间
  startedTime: { type: Date }, // 开始时间
  completedTime: { type: Date } // 完成时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IImageGenTask>("ImageGenTask", ImageGenTaskSchema);