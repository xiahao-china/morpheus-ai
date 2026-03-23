<template>
  <Layouts>
    <view :class="pageStyle['drawingV2']">
      <view :class="pageStyle['conversationShell']">
        <InfiniteConversation @publish="handlePublish"/>
      </view>

      <BottomDialog :mode-options="DRAWING_MODE_OPTIONS"/>
      <PublishSquareDialog
        ref="publishSquareDialogRef"
        @published="handlePublishSuccess"
      />
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Taro from "@tarojs/taro";
import Layouts from "@/components/Layouts/index.vue";
import { useDrawingV2ConversationStore } from "@/store";
import InfiniteConversation from "@/pages/DrawingV2/components/InfiniteConversation/index.vue";
import BottomDialog from "@/pages/DrawingV2/components/BottomDialog/index.vue";
import PublishSquareDialog from "@/pages/DrawingV2/components/PublishSquareDialog/index.vue";
import {
  DRAWING_MODE_OPTIONS,
  type IDrawingV2Message,
} from "./const";
import pageStyle from "./index.module.less";

const drawingV2ConversationStore = useDrawingV2ConversationStore();
const publishSquareDialogRef = ref<InstanceType<typeof PublishSquareDialog> | null>(null);

const handlePublish = async (message: IDrawingV2Message) => {
  if (message.isPublished) {
    Taro.showToast({ title: "已经发布", icon: "none" });
    return;
  }
  if (!message.imageId) {
    Taro.showToast({ title: "图片未完成", icon: "none" });
    return;
  }
  if (!publishSquareDialogRef.value) {
    return;
  }
  publishSquareDialogRef.value.startPublish({
    messageId: message.id,
    imageId: message.imageId,
    drawTaskId: message.taskId,
    imageUrl: message.imageUrl,
  });
};

const handlePublishSuccess = (payload: { messageId: string }) => {
  drawingV2ConversationStore.updateTaskInfo(payload.messageId, { isPublished: true });
};

onMounted(() => {
  if (drawingV2ConversationStore.messages.length === 0) {
    drawingV2ConversationStore.reset();
    drawingV2ConversationStore.loadNextPage();
    return;
  }
  drawingV2ConversationStore.resumePollingForActiveTasks();
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>

<style lang="less" scoped>
</style>
