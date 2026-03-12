import Taro from '@tarojs/taro';
import type { Ref } from 'vue';

import {
  handleGenerationInfoByTask,
  type IHandleGenerationInfoByTaskParams,
  type IReGenerationInfo
} from '@/pages/app/const.ts';
import { createGenerateTaskStream, type GeneratedImageResponse, type IGenerateTaskData } from '@/api/images/createImagesEditedTaskStream.ts';
import type { SSEReader } from '@/lib/request/sse.ts';
import type { ImageGenerationResponse } from '@/api/images/getGenerateTaskStatus.ts';
import type { IGetGenerationHistoryItem } from '@/api/images/getGenerationHistoryDetail.ts';
import { CHANGE_IMAGE_MODE_LIST, EFunctionGroupMode } from './components/FunctionGroup/const.ts';
import { EEnlargeMode } from '@/pages/CarefullyReviseTheImage/components/ResolutionSetting/const.ts';
import type { IObject } from '@/constants/types.ts';

export enum EReDrawStyle {
  // 原有风格
  ORIGINAL = 'original',
  // 自定义风格
  CUSTOM = 'custom',
}

export interface IChangeImageTaskStatusInfo {
  generating: boolean;
  progress: number;
  taskId: string;
  generationStartTime: number;
}

export const DEFAULT_CHANGE_IMAGE_TASK_STATUS_INFO: IChangeImageTaskStatusInfo = {
  generating: false,
  progress: 0,
  taskId: '',
  generationStartTime: 0,
};

export const RE_DRAW_STYLERADIO_GROUP = [
  {
    label: '原有风格',
    value: EReDrawStyle.ORIGINAL,
  },
  {
    label: '自定义风格',
    value: EReDrawStyle.CUSTOM,
  },
];

export const MASK_LAYER_DRAW_CAN_USE_TYPE = [
  EFunctionGroupMode.LOCAL_REDRAW,
  EFunctionGroupMode.INTELLIGENT_CLEAR,
  EFunctionGroupMode.ALL_THINGS_TRANSFER,
];

// 获取改图功能初始化参数（来自重新生成等）
export const getPageInitParams = () => {
  let info: IChangeImageGenerationInfo | null = null;
  try {
    // 使用Taro获取当前页面实例和参数
    const pages = Taro.getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      
      if (!options.initData) return;
      info = JSON.parse(decodeURIComponent(options.initData as string)) as IChangeImageGenerationInfo;
    }
  } catch (error) {
    console.error(error);
  }
  return info;
};

export interface IChangeImageGenerationInfo extends IReGenerationInfo {
  type: EFunctionGroupMode;
  concreteSceneId?: number;
  isChangeImage?: boolean;
  uploadImageUrl?: string;
  uploadImageId?: string;
  maskImageUrl?: string;
  maskImageId?: string;
  originTaskId?: string;
  scale?: EEnlargeMode;
}



export interface IStartChangeImageGenerationHandle {
  resetGeneratingState: () => void;
  onSuccess: (taskData: GeneratedImageResponse) => void;
  onCreateGenerateTaskStream: (currentStream: Error | SSEReader<IGenerateTaskData>) => void;
}

export const startChangeImageGeneration = async (
  taskId: string,
  changeImageTaskStatusInfo: Ref<IChangeImageTaskStatusInfo>,
  handle: IStartChangeImageGenerationHandle,
) => {
  const { resetGeneratingState, onSuccess, onCreateGenerateTaskStream } = handle;
  try {
    changeImageTaskStatusInfo.value.generating = true;
    changeImageTaskStatusInfo.value.generationStartTime = Date.now();
    changeImageTaskStatusInfo.value.progress = 0;
    changeImageTaskStatusInfo.value.taskId = taskId;

    const currentStream = await createGenerateTaskStream(taskId);
    onCreateGenerateTaskStream(currentStream);
    if (currentStream instanceof Error) {
      console.error('生成任务失败:', currentStream);
      Taro.showToast({
        title: '网络错误，请稍后重试',
        icon: 'error',
        duration: 2000
      });
      resetGeneratingState();
      return;
    }

    currentStream.onProgress((data) => {
      console.log('生成进度:', data);
      // 确保进度值是有效的数字
      if (data && typeof data.percent === 'number' && data.percent >= 0 && data.percent <= 100) {
        if (data.generationId)
          changeImageTaskStatusInfo.value.taskId = data.generationId.toString();
        const newProgress = Math.round(data.percent);
        console.log(
          '更新进度值:',
          newProgress,
          '当前值:',
          changeImageTaskStatusInfo.value.progress,
        );
        changeImageTaskStatusInfo.value.progress = newProgress === 100 ? 99 : newProgress;
      }

      if (data.status === 'COMPLETED'){
        changeImageTaskStatusInfo.value.progress = 100;
      }

      // 如果任务完成，处理最终数据
      if (data.status === 'COMPLETED' && data.data) {
        const taskData = data.data;
        onSuccess(taskData);
        console.log('taskData', taskData);
        // 重置生成状态
        resetGeneratingState();
        changeImageTaskStatusInfo.value.generating = false;
        console.log('生成任务完成:', taskData);
      } else if (data.status === 'FAILED') {
        console.log('data', data);
        console.error('生成任务失败:', data);
        Taro.showToast({
          title: data.message || '图片生成失败，请重试',
          icon: 'error',
          duration: 2000
        });
        resetGeneratingState();
        changeImageTaskStatusInfo.value.generating = false;
      }
    });

    currentStream.onEnd(() => {
      console.log('SSE 连接结束');
      // 如果还在生成状态，说明可能是连接断开，重置状态
      changeImageTaskStatusInfo.value.generating = false;
      resetGeneratingState();
    });

    // 开始流处理
    currentStream.pip();
  } catch (error) {
    console.error('生成任务异常:', error);
    Taro.showToast({
      title: '系统异常，请稍后重试',
      icon: 'error',
      duration: 2000
    });
    resetGeneratingState();
  }
};

export interface IHandleGenerationInfoByChangeImageTaskParams extends IHandleGenerationInfoByTaskParams {
  type?: EFunctionGroupMode;
  images: ({
    imageUrl: string;
    fileResourceId: number;
  } & IObject)[];
  maskImageUrl?: string;
  maskImageId?: string;
  magnificationOutward?: EEnlargeMode;
  concreteSceneId?: number;
}

export const handleGenerationInfoByChangeImageTask = (
  taskInfo: IHandleGenerationInfoByChangeImageTaskParams | GeneratedImageResponse,
  orderIndex?: number
): IChangeImageGenerationInfo => {
  console.log('changeImageTaskInfo', taskInfo);
  if (taskInfo.type && CHANGE_IMAGE_MODE_LIST.includes(taskInfo.type)){
    return {
      ...handleGenerationInfoByTask(taskInfo as ImageGenerationResponse | IGetGenerationHistoryItem),
      type: taskInfo.type,
      concreteSceneId: taskInfo.concreteSceneId,
      isChangeImage: true,
      uploadImageUrl: taskInfo.underImageUrl || '',
      uploadImageId: '',
      maskImageUrl: taskInfo.maskImageUrl || '',
      maskImageId: taskInfo.maskImageId || '',
      originTaskId: '',
      scale: taskInfo.magnificationOutward as EEnlargeMode,
    }
  }
  return {
    ...handleGenerationInfoByTask(taskInfo as ImageGenerationResponse | IGetGenerationHistoryItem),
    isChangeImage: false,
    uploadImageUrl: taskInfo.images[orderIndex ?? 0].imageUrl,
    uploadImageId: taskInfo.images[orderIndex ?? 0].fileResourceId.toString(),
    type: EFunctionGroupMode.ONE_KEY_RENDER,
    originTaskId: taskInfo.id.toString(),
    prompt: '', // 绘图的提示词不回填改图
  };
};
