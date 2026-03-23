<template>
  <view :class="pageStyle['conversation']">
    <scroll-view
      :class="pageStyle['scroll']"
      :scroll-y="true"
      :show-scrollbar="false"
      @scrolltolower="handleLoadMore"
    >
      <view :class="pageStyle['content']">
        <template v-for="message in drawingV2ConversationStore.messages" :key="message.id">
          <MyInfo
            v-if="message.role === 'user'"
            :content="message.prompt"
            :upload-image-url="message.underImageUrl"
          />
          <ServiceInfo
            v-else
            :message="message"
            @like="handleLike"
            @publish="emit('publish', $event)"
            @regenerate="handleRegenerate"
            @download="handleDownload"
          />
        </template>

        <view :class="pageStyle['status']">
          <text v-if="drawingV2ConversationStore.historyLoading">加载中...</text>
          <text v-else-if="drawingV2ConversationStore.historyLoadEnd">没有更多历史任务了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useDrawingV2ConversationStore } from "@/store";
import type { IDrawingV2Message } from "@/pages/DrawingV2/const";
import MyInfo from "@/pages/DrawingV2/components/MyInfo/index.vue";
import ServiceInfo from "@/pages/DrawingV2/components/ServiceInfo/index.vue";
import pageStyle from "./index.module.less";

const drawingV2ConversationStore = useDrawingV2ConversationStore();

const emit = defineEmits<{
  publish: [message: IDrawingV2Message];
}>();

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
