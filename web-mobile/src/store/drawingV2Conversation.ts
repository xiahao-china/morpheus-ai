import { computed, ref } from "vue";
import { defineStore } from "pinia";
import Taro from "@tarojs/taro";
import { batchDownload } from "@/util/download";
import { getImagesTask } from "@/api/generate/workStream";
import { getGenerateProgress } from "@/api/generate/getGenerateProgress";
import { getRecentGenerationsV2 } from "@/api/images/getGenerationHistoryV2";
import { generateImageFeedbackLike } from "@/api/images/generateImageFeedback";
import {
  createPendingServiceMessage,
  createUserMessage,
  mapHistoryToServiceMessages,
  PAGE_SIZE,
  type IDrawingModeOption,
  type IDrawingV2Message,
} from "@/pages/DrawingV2/const";

const activeStatusList = ["INITIATED", "PENDING", "PROCESSING"] as const;

export const useDrawingV2ConversationStore = defineStore("drawingV2Conversation", () => {
  const messages = ref<IDrawingV2Message[]>([]);
  const historyPage = ref(1);
  const historyLoading = ref(false);
  const historyLoadEnd = ref(false);
  const pollingTaskMap = new Map<string, number>();

  const hasActiveTask = computed(() =>
    messages.value.some((message) =>
      message.role === "service" && activeStatusList.includes(message.status as (typeof activeStatusList)[number])
    )
  );

  const mergeHistoryMessages = (historyMessages: IDrawingV2Message[]) => {
    const existed = new Set(messages.value.map((item) => item.id));
    const next = historyMessages.filter((item) => !existed.has(item.id));
    messages.value = messages.value.concat(next);
  };

  const normalizeStatus = (status?: string): IDrawingV2Message["status"] => {
    const upperStatus = String(status || "").toUpperCase();
    if (upperStatus === "FAILED") return "FAILED";
    if (upperStatus === "COMPLETED") return "COMPLETED";
    if (upperStatus === "PROCESSING") return "PROCESSING";
    if (upperStatus === "INITIATED") return "INITIATED";
    return "PENDING";
  };

  const clearPolling = (messageId: string) => {
    const timer = pollingTaskMap.get(messageId);
    if (timer) {
      clearInterval(timer);
      pollingTaskMap.delete(messageId);
    }
  };

  const updateTaskInfo = (messageId: string, patch: Partial<IDrawingV2Message>) => {
    messages.value = messages.value.map((message) => {
      if (message.id !== messageId) {
        return message;
      }
      return {
        ...message,
        ...patch,
      };
    });
  };

  const startPollingTask = (messageId: string, taskId: string) => {
    clearPolling(messageId);
    const timer = setInterval(async () => {
      const statusResponse = await getGenerateProgress(taskId);
      if (statusResponse instanceof Error || statusResponse.code !== 200) {
        return;
      }
      const data = statusResponse.data;
      const nextStatus = normalizeStatus(data.status);
      if (nextStatus === "FAILED") {
        updateTaskInfo(messageId, { status: "FAILED", progress: data.progress || 0 });
        clearPolling(messageId);
        return;
      }
      if (nextStatus === "COMPLETED") {
        updateTaskInfo(messageId, {
          status: "COMPLETED",
          progress: 100,
          imageUrl: data.imageUrl || "",
          imageId: data.imageId || "",
        });
        clearPolling(messageId);
        return;
      }
      updateTaskInfo(messageId, {
        status: nextStatus,
        progress: data.progress || 0,
      });
    }, 3000);
    pollingTaskMap.set(messageId, timer as unknown as number);
  };

  const resumePollingForMessages = (targetMessages: IDrawingV2Message[]) => {
    targetMessages.forEach((message) => {
      if (
        message.role !== "service" ||
        !activeStatusList.includes(message.status as (typeof activeStatusList)[number]) ||
        !message.taskId ||
        pollingTaskMap.has(message.id)
      ) {
        return;
      }
      startPollingTask(message.id, message.taskId);
    });
  };

  const loadNextPage = async () => {
    if (historyLoading.value || historyLoadEnd.value) {
      return { ok: true, list: [] as IDrawingV2Message[] };
    }
    historyLoading.value = true;
    const response = await getRecentGenerationsV2({
      page: historyPage.value,
      pageSize: PAGE_SIZE,
    });
    historyLoading.value = false;
    if (response instanceof Error || response.code !== 200) {
      return { ok: false, list: [] as IDrawingV2Message[] };
    }
    const list = response.data?.list || [];
    if (!list.length) {
      historyLoadEnd.value = true;
      return { ok: true, list: [] as IDrawingV2Message[] };
    }
    const mapped = mapHistoryToServiceMessages(list);
    mergeHistoryMessages(mapped);
    resumePollingForMessages(mapped);
    historyPage.value += 1;
    if (list.length < PAGE_SIZE) {
      historyLoadEnd.value = true;
    }
    return { ok: true, list: mapped };
  };

  const addCreatingTask = (params: {
    prompt: string;
    mode: IDrawingModeOption;
    underImageId?: string;
    underImageUrl?: string;
  }) => {
    const userMessage = createUserMessage(params.prompt, params.mode, params.underImageUrl);
    const serviceMessage = createPendingServiceMessage(
      params.prompt,
      params.mode,
      params.underImageId,
      params.underImageUrl,
    );
    serviceMessage.status = "INITIATED";
    serviceMessage.progress = 0;
    messages.value = [userMessage, serviceMessage, ...messages.value];
    return {
      userMessageId: userMessage.id,
      serviceMessageId: serviceMessage.id,
    };
  };

  const removeMessages = (messageIds: string[]) => {
    const idSet = new Set(messageIds);
    messages.value = messages.value.filter((message) => !idSet.has(message.id));
  };

  const submitTask = async (params: {
    prompt: string;
    mode: IDrawingModeOption;
    underImageId?: string;
    underImageUrl?: string;
  }) => {
    const activeTaskTip = "当前任务正在进行中，喝杯茶等一下吧~";
    if (hasActiveTask.value) {
      Taro.showToast({ title: activeTaskTip, icon: "none" });
      return { ok: false };
    }
    const prompt = params.prompt.trim();
    if (!prompt) {
      return { ok: false };
    }
    const { userMessageId, serviceMessageId } = addCreatingTask({
      prompt,
      mode: params.mode,
      underImageId: params.underImageId,
      underImageUrl: params.underImageUrl,
    });
    const createResponse = await getImagesTask({
      prompt,
      count: 1,
      ratio: params.underImageId ? undefined : "1:1",
      type: params.mode.type,
      base_images: params.underImageId ? [params.underImageId] : undefined,
      width: params.underImageId ? undefined : 1024,
      height: params.underImageId ? undefined : 1024,
    });
    if (createResponse instanceof Error || createResponse.code !== 200) {
      const errorMessage = createResponse instanceof Error
        ? "任务创建失败"
        : (createResponse.message || createResponse.msg || "任务创建失败");
      if (errorMessage === activeTaskTip) {
        removeMessages([userMessageId, serviceMessageId]);
      } else {
        updateTaskInfo(serviceMessageId, { status: "FAILED" });
      }
      Taro.showToast({ title: errorMessage, icon: "none" });
      return { ok: false };
    }
    const taskId = createResponse.data?.taskId || "";
    if (!taskId) {
      updateTaskInfo(serviceMessageId, { status: "FAILED" });
      return { ok: false };
    }
    updateTaskInfo(serviceMessageId, {
      status: normalizeStatus(createResponse.data?.status),
      taskId,
      progress: 0,
    });
    startPollingTask(serviceMessageId, taskId);
    return { ok: true };
  };

  const likeMessage = async (message: IDrawingV2Message) => {
    if (!message.imageId) {
      Taro.showToast({ title: "暂无可反馈图片", icon: "none" });
      return;
    }
    const response = await generateImageFeedbackLike(message.imageId);
    if (response instanceof Error || response.code !== 200) {
      Taro.showToast({ title: "点赞失败", icon: "error" });
      return;
    }
    updateTaskInfo(message.id, { isLiked: Boolean(response.data?.isLiked) });
  };

  const regenerateMessage = async (message: IDrawingV2Message) => {
    return submitTask({
      prompt: message.prompt,
      mode: message.mode,
      underImageId: message.underImageId,
      underImageUrl: message.underImageUrl,
    });
  };

  const downloadMessage = async (message: IDrawingV2Message) => {
    if (!message.imageUrl) {
      Taro.showToast({ title: "暂无可下载内容", icon: "none" });
      return;
    }
    await batchDownload([message.imageUrl]);
  };

  const resumePollingForActiveTasks = () => {
    resumePollingForMessages(messages.value);
  };

  const reset = () => {
    Array.from(pollingTaskMap.keys()).forEach((key) => clearPolling(key));
    messages.value = [];
    historyPage.value = 1;
    historyLoading.value = false;
    historyLoadEnd.value = false;
  };

  return {
    messages,
    historyPage,
    historyLoading,
    historyLoadEnd,
    hasActiveTask,
    loadNextPage,
    updateTaskInfo,
    addCreatingTask,
    removeMessages,
    submitTask,
    likeMessage,
    regenerateMessage,
    downloadMessage,
    resumePollingForActiveTasks,
    reset,
  };
});
