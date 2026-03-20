import { IGenerationQueue } from "@/models/generationQueue";
import { IGenerationTask, TaskChannelEnum, TaskPurposeChannelMapping, TaskStatusEnum } from "@/models/generationTask";

export const POLL_INTERVAL = 2000;
export const DEFAULT_TIMEOUT = 300000;
export const PROGRESS_UPDATE_INTERVAL = 5000;

const SYNC_SUPPORTED_CHANNELS = new Set<TaskChannelEnum>([
  TaskChannelEnum.LLM,
  TaskChannelEnum.VLLM,
  TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE
]);

const THIRD_PARTY_CHANNELS = new Set<TaskChannelEnum>([
  TaskChannelEnum.LLM,
  TaskChannelEnum.VLLM,
  TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE
]);

export const resolveTaskChannel = (generationTask: IGenerationTask): TaskChannelEnum => {
  return (generationTask.purpose && TaskPurposeChannelMapping[generationTask.purpose]) || TaskChannelEnum.COMFYUI;
};

export const isSyncExecutableChannel = (taskChannel: TaskChannelEnum): boolean => {
  return SYNC_SUPPORTED_CHANNELS.has(taskChannel);
};

export const isThirdPartyChannel = (taskChannel: TaskChannelEnum): boolean => {
  return THIRD_PARTY_CHANNELS.has(taskChannel);
};

export const buildTaskRuntimeParams = (generationTask: IGenerationTask, taskId: string) => {
  return { ...generationTask.params, taskId, userId: generationTask.userId };
};

export const buildSyncCompletionUpdate = (
  taskChannel: TaskChannelEnum,
  content: string,
  savedImageGenId?: string
) => {
  const updateData: any = {
    status: TaskStatusEnum.COMPLETED,
    completedTime: new Date()
  };
  if (taskChannel === TaskChannelEnum.THIRD_PARTY_GENERATION_IMAGE && savedImageGenId) {
    updateData.$push = { ImageGenIds: savedImageGenId };
  } else {
    updateData.textGenText = content;
  }
  return updateData;
};

export const buildSyncTaskResponse = (
  taskId: string,
  content: string,
  savedImageGenId?: string
) => {
  return {
    taskId,
    status: TaskStatusEnum.COMPLETED,
    content,
    imageGenId: savedImageGenId
  };
};

export type SchedulerQueueItem = {
  queueTask: IGenerationQueue;
  generationTask: IGenerationTask;
  taskChannel: TaskChannelEnum;
};
