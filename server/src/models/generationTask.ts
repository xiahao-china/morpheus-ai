import mongoose, { Schema, Document } from "mongoose";

export enum TaskStatusEnum {
  INITIATED = 'INITIATED', // 初始化
  PENDING = 'PENDING', // 等待中
  PROCESSING = 'PROCESSING', // 处理中
  COMPLETED = 'COMPLETED', // 已完成
  CANCEL = 'CANCEL', // 取消
  FAILED = 'FAILED' // 失败
}

export enum TaskPurposeEnum {
  TXT2IMG = 'TXT2IMG', // 文生图
  IMG2IMG = 'IMG2IMG', // 图生图
  UPSCALE = 'UPSCALE', // 高清放大
  TRANSLATION = 'TRANSLATION', // 翻译
  PROMPT_OPTIMIZATION = 'PROMPT_OPTIMIZATION', // 提示词优化
  FENG_SHUI = 'FENG_SHUI' // 风水
}

export enum TaskChannelEnum {
  COMFYUI = 'COMFYUI',
  LLM = 'LLM',
  VLLM = 'VLLM',
  THIRD_PARTY_GENERATION_IMAGE = 'THIRD_PARTY_GENERATION_IMAGE'
}

// 任务用途与渠道的映射关系
export const TaskPurposeChannelMapping: Record<TaskPurposeEnum, TaskChannelEnum> = {
  [TaskPurposeEnum.TXT2IMG]: TaskChannelEnum.COMFYUI,
  [TaskPurposeEnum.IMG2IMG]: TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE,
  [TaskPurposeEnum.UPSCALE]: TaskChannelEnum.COMFYUI,
  [TaskPurposeEnum.TRANSLATION]: TaskChannelEnum.LLM,
  [TaskPurposeEnum.PROMPT_OPTIMIZATION]: TaskChannelEnum.LLM,
  [TaskPurposeEnum.FENG_SHUI]: TaskChannelEnum.VLLM
};

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

export interface IGenerationTask extends Document {
  userId: string; // 用户ID
  status: TaskStatusEnum; // 任务状态
  purpose?: TaskPurposeEnum; // 用途
  params: any; // 生成参数
  comfyui: any; // ComfyUI配置

  // 结果信息
  ImageGenIds?: string[]; // 关联的生成图片ID列表
  textGenText?: string; // 生成的文本结果

  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  startedTime?: Date; // 开始时间
  completedTime?: Date; // 完成时间
}

const GenerationTaskSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true }, // 用户ID
  status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.PENDING, index: true }, // 任务状态
  purpose: { type: String, enum: Object.values(TaskPurposeEnum) }, // 用途

  params: GenerationParamsSchema, // 生成参数
  comfyui: ComfyUIConfigSchema, // ComfyUI配置

  // 结果信息
  ImageGenIds: [{ type: String }], // 关联的生成图片ID列表
  textGenText: { type: String }, // 生成的文本结果

  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now }, // 更新时间
  startedTime: { type: Date }, // 开始时间
  completedTime: { type: Date } // 完成时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IGenerationTask>("GenerationTask", GenerationTaskSchema);