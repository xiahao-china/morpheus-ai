<template>
  <view :class="pageStyle['conversation']">
    <scroll-view
      :class="pageStyle['scroll']"
      :scroll-y="true"
      :show-scrollbar="false"
      @scrolltolower="emit('loadMore')"
    >
      <view :class="pageStyle['content']">
        <template v-for="message in props.messages" :key="message.id">
          <MyInfo
            v-if="message.role === 'user'"
            :content="message.prompt"
            :upload-image-url="message.underImageUrl"
          />
          <ServiceInfo
            v-else
            :message="message"
            @like="emit('like', $event)"
            @publish="emit('publish', $event)"
            @regenerate="emit('regenerate', $event)"
            @download="emit('download', $event)"
          />
        </template>

        <view :class="pageStyle['status']">
          <text v-if="props.loading">加载中...</text>
          <text v-else-if="props.loadEnd">没有更多历史任务了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { IDrawingV2Message } from "@/pages/DrawingV2/const";
import MyInfo from "@/pages/DrawingV2/components/MyInfo/index.vue";
import ServiceInfo from "@/pages/DrawingV2/components/ServiceInfo/index.vue";
import type { IInfiniteConversationProps } from "./const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IInfiniteConversationProps>(), {
  messages: () => [],
  loading: false,
  loadEnd: false,
});

const emit = defineEmits<{
  loadMore: [];
  like: [message: IDrawingV2Message];
  publish: [message: IDrawingV2Message];
  regenerate: [message: IDrawingV2Message];
  download: [message: IDrawingV2Message];
}>();
</script>
