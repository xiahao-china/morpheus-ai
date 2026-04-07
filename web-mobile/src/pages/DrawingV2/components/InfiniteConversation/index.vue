<template>
  <view :class="pageStyle['conversation']">
    <InfiniteScroll
      ref="infiniteScrollRef"
      :loading="drawingV2ConversationStore.historyLoading"
      :load-end="drawingV2ConversationStore.historyLoadEnd"
      direction="up"
      :scroll-into-view="lastMessageId"
      @load-more="handleLoadMore"
    >
      <template v-for="message in reversedMessages" :key="message.id">
        <view :id="`msg-${message.id}`">
          <ServiceInfo
            v-if="message.role === 'service'"
            :message="message"
            @like="handleLike"
            @publish="emit('publish', $event)"
            @regenerate="handleRegenerate"
            @download="handleDownload"
          />
          <MyInfo
            v-else
            :content="message.prompt"
            :upload-image-url="message.underImageUrl"
          />
        </view>
      </template>
    </InfiniteScroll>
  </view>
</template>

<script setup lang="ts">
import {computed, ref, nextTick} from "vue";
import { useDrawingV2ConversationStore } from "@/store";
import type { IDrawingV2Message } from "@/pages/DrawingV2/const";
import MyInfo from "@/pages/DrawingV2/components/MyInfo/index.vue";
import ServiceInfo from "@/pages/DrawingV2/components/ServiceInfo/index.vue";
import InfiniteScroll from "@/pages/DrawingV2/components/InfiniteScroll/index.vue";
import pageStyle from "./index.module.less";

const drawingV2ConversationStore = useDrawingV2ConversationStore();
const infiniteScrollRef = ref<InstanceType<typeof InfiniteScroll> | null>(null);

const reversedMessages = computed(() => {
  return [...drawingV2ConversationStore.messages].reverse();
});

const lastMessageId = computed(() => {
  if (reversedMessages.value.length === 0) return '';
  return `msg-${reversedMessages.value[reversedMessages.value.length - 1].id}`;
});

const emit = defineEmits<{
  publish: [message: IDrawingV2Message];
}>();

const scrollToBottom = () => {
  nextTick(() => {
    infiniteScrollRef.value?.scrollToBottom();
  });
};

const scrollToView = (id: string) => {
  nextTick(() => {
    infiniteScrollRef.value?.scrollToView(id);
  });
};

// 暴露滚动方法
defineExpose({
  scrollToBottom,
  scrollToView,
});

const handleLoadMore = () => {
  drawingV2ConversationStore.loadNextPage();
};

const handleLike = (message: IDrawingV2Message) => {
  drawingV2ConversationStore.likeMessage(message);
};

const handleRegenerate = (message: IDrawingV2Message) => {
  drawingV2ConversationStore.regenerateMessage(message);
};

const handleDownload = (message: IDrawingV2Message) => {
  drawingV2ConversationStore.downloadMessage(message);
};
</script>
