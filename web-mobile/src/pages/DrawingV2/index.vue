<template>
  <Layouts>
    <view :class="pageStyle['drawingV2']">
      <view :class="pageStyle['conversationShell']">
        <InfiniteConversation
          :messages="messages"
          :loading="historyLoading"
          :load-end="historyLoadEnd"
          @load-more="fetchNextHistory"
          @like="handleLike"
          @dislike="handleDislike"
          @publish="handlePublish"
          @regenerate="handleRegenerate"
          @download="handleDownload"
        />
      </view>

      <BottomDialog
        ref="bottomDialogRef"
        :mode-options="DRAWING_MODE_OPTIONS"
        :generating="generating"
        @submit="handleSubmit"
      />
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Taro from "@tarojs/taro";
import Layouts from "@/components/Layouts/index.vue";
import { batchDownload } from "@/util/download";
import { getImagesTask } from "@/api/generate/workStream";
import { getGenerateProgress } from "@/api/generate/getGenerateProgress";
import { getRecentGenerationsV2 } from "@/api/images/getGenerationHistoryV2";
import {
  ESourceType,
  generateImageFeedbackDislike,
  generateImageFeedbackLike,
} from "@/api/images/generateImageFeedback";
import { publishToSquare } from "@/api/square/publishToSquare";
import InfiniteConversation from "@/pages/DrawingV2/components/InfiniteConversation/index.vue";
import BottomDialog from "@/pages/DrawingV2/components/BottomDialog/index.vue";
import type { IDrawingSubmitPayload } from "@/pages/DrawingV2/components/BottomDialog/const";
import {
  createPendingServiceMessage,
  createUserMessage,
  DRAWING_MODE_OPTIONS,
  mapHistoryToServiceMessages,
  PAGE_SIZE,
  type IDrawingV2Message,
} from "./const";
import pageStyle from "./index.module.less";

const messages = ref<IDrawingV2Message[]>([]);
const generating = ref(false);
const historyPage = ref(1);
const historyLoading = ref(false);
const historyLoadEnd = ref(false);
const pollingTaskMap = new Map<string, number>();
const bottomDialogRef = ref<InstanceType<typeof BottomDialog> | null>(null);

const mergeHistoryMessages = (historyMessages: IDrawingV2Message[]) => {
  const existed = new Set(messages.value.map((item) => item.id));
  const next = historyMessages.filter((item) => !existed.has(item.id));
  messages.value = messages.value.concat(next);
};

const fetchNextHistory = async () => {
  if (historyLoading.value || historyLoadEnd.value) {
    return;
  }
  historyLoading.value = true;
  const response = await getRecentGenerationsV2({
    page: historyPage.value,
    pageSize: PAGE_SIZE,
  });
  historyLoading.value = false;
  if (response instanceof Error || response.code !== 200) {
    Taro.showToast({ title: "历史加载失败", icon: "error" });
    return;
  }
  const list = response.data?.list || [];
  if (!list.length) {
    historyLoadEnd.value = true;
    return;
  }
  mergeHistoryMessages(mapHistoryToServiceMessages(list));
  historyPage.value += 1;
  if (list.length < PAGE_SIZE) {
    historyLoadEnd.value = true;
  }
};

const patchMessage = (id: string, patch: Partial<IDrawingV2Message>) => {
  messages.value = messages.value.map((message) => {
    if (message.id !== id) {
      return message;
    }
    return {
      ...message,
      ...patch,
    };
  });
};

const clearPolling = (messageId: string) => {
  const timer = pollingTaskMap.get(messageId);
  if (timer) {
    clearInterval(timer);
    pollingTaskMap.delete(messageId);
  }
};

const startPollingTask = (messageId: string, taskId: string) => {
  clearPolling(messageId);
  const timer = setInterval(async () => {
    const statusResponse = await getGenerateProgress(taskId);
    if (statusResponse instanceof Error || statusResponse.code !== 200) {
      return;
    }
    const data = statusResponse.data;
    if (data.status === "FAILED") {
      patchMessage(messageId, { status: "FAILED" });
      clearPolling(messageId);
      generating.value = false;
      return;
    }
    if (data.status === "COMPLETED") {
      patchMessage(messageId, {
        status: "COMPLETED",
        imageUrl: data.imageUrl || "",
        imageId: data.imageId || "",
      });
      clearPolling(messageId);
      generating.value = false;
      return;
    }
    patchMessage(messageId, { status: "PROCESSING" });
  }, 3000);
  pollingTaskMap.set(messageId, timer as unknown as number);
};

const handleSubmit = async (payload: IDrawingSubmitPayload) => {
  const prompt = payload.prompt.trim();
  if (!prompt) {
    return;
  }
  generating.value = true;
  const userMessage = createUserMessage(prompt, payload.mode, payload.underImageUrl);
  const serviceMessage = createPendingServiceMessage(
    prompt,
    payload.mode,
    payload.underImageId,
    payload.underImageUrl,
  );
  messages.value = [userMessage, serviceMessage, ...messages.value];

  const createResponse = await getImagesTask({
    prompt,
    count: 1,
    ratio: payload.underImageId ? undefined : "1:1",
    type: payload.mode.type,
    base_images: payload.underImageId ? [payload.underImageId] : undefined,
    width: payload.underImageId ? undefined : 1024,
    height: payload.underImageId ? undefined : 1024,
  });

  if (createResponse instanceof Error || createResponse.code !== 200) {
    patchMessage(serviceMessage.id, { status: "FAILED" });
    generating.value = false;
    Taro.showToast({ title: "任务创建失败", icon: "error" });
    return;
  }

  const taskId = createResponse.data?.taskId || "";
  if (!taskId) {
    patchMessage(serviceMessage.id, { status: "FAILED" });
    generating.value = false;
    return;
  }
  patchMessage(serviceMessage.id, { status: "PROCESSING", taskId });
  bottomDialogRef.value?.reset();
  startPollingTask(serviceMessage.id, taskId);
};

const handleLike = async (message: IDrawingV2Message) => {
  if (!message.imageId) {
    Taro.showToast({ title: "暂无可反馈图片", icon: "none" });
    return;
  }
  const response = await generateImageFeedbackLike(message.imageId, ESourceType.GENERATION);
  if (response instanceof Error || response.code !== 200) {
    Taro.showToast({ title: "点赞失败", icon: "error" });
    return;
  }
  Taro.showToast({ title: "已记录您的点赞", icon: "success" });
};

const handleDislike = async (message: IDrawingV2Message) => {
  if (!message.imageId) {
    Taro.showToast({ title: "暂无可反馈图片", icon: "none" });
    return;
  }
  const response = await generateImageFeedbackDislike(message.imageId, ESourceType.GENERATION);
  if (response instanceof Error || response.code !== 200) {
    Taro.showToast({ title: "点踩失败", icon: "error" });
    return;
  }
  Taro.showToast({ title: "反馈已提交", icon: "success" });
};

const handlePublish = async (message: IDrawingV2Message) => {
  if (!message.imageId) {
    Taro.showToast({ title: "图片未完成", icon: "none" });
    return;
  }
  const response = await publishToSquare({
    title: (message.prompt || "AI生成方案").slice(0, 20),
    caption: message.prompt || "AI生成内容",
    imageId: message.imageId,
    drawTaskId: message.taskId,
  });
  if (response instanceof Error || response.code !== 200) {
    Taro.showToast({ title: "发布失败", icon: "error" });
    return;
  }
  Taro.showToast({ title: "已发布到广场", icon: "success" });
};

const handleDownload = async (message: IDrawingV2Message) => {
  if (!message.imageUrl) {
    Taro.showToast({ title: "暂无可下载内容", icon: "none" });
    return;
  }
  await batchDownload([message.imageUrl]);
};

const handleRegenerate = (message: IDrawingV2Message) => {
  handleSubmit({
    prompt: message.prompt,
    mode: message.mode,
    underImageId: message.underImageId,
    underImageUrl: message.underImageUrl,
  });
};

onMounted(() => {
  fetchNextHistory();
});

onUnmounted(() => {
  Array.from(pollingTaskMap.keys()).forEach((key) => clearPolling(key));
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>

<style lang="less" scoped>
</style>
