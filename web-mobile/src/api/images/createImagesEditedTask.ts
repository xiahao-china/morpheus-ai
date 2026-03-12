import { httpPost } from "@/lib/request/http";
import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const'
import { EScaleType } from '@/pages/CarefullyReviseTheImage/components/ScaleType/const';


export interface ICreateImagesEditedTaskParams {
  originalImageGenerationId?: number; // 来自绘图的原始图像生成任务ID
  originalImageId?: number; // 来自绘图的原始生成图像ID

  uploadImageId?: number; // 上传的图像Id

  maskImageId?: string; // 蒙版图像Id

  scene?: string; // 选择的场景[精致模型渲染、白膜渲染]
  enlargedType?: EScaleType;
  enlargedParamOutward?: number;
  styleExtractionLevelOutward?: number; // 风格模型参考程度（外部）
  styleModelId?: number; // 风格模型ID
  concreteSceneId?: number; // 具体场景ID

  prompt?: string; // 正向提示词
  negativePrompt?: string; // 反向提示词
  promptImageId?: number; // 提示词图像Id
  negativePromptImageId?: number; // 反向提示词图像Id
  ratio?: string; // 出图比例, 如 1:1
  width?: number; // 出图宽度
  height?: number; // 出图高度
  count?: number; // 生成数量
  type?: EFunctionGroupMode; // 编辑类型 [一件渲染, 局部重绘, 智能清除, 高清放大]

  magnificationOutward?: number;
  materialImageId?: string;
}


interface GenerateTaskResponse {
  id: number;
}

export const createImagesEditedTask = async (params: ICreateImagesEditedTaskParams) => {
  return httpPost<ICreateImagesEditedTaskParams, GenerateTaskResponse>('/images/edited', params);
}
