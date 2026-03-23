<template>
  <view :class="pageStyle['serviceInfo']">
    <view :class="pageStyle['shell']">
      <view :class="pageStyle['intro']" v-if="message.status !== 'COMPLETED'">
        <view v-if="message.status === 'FAILED'" :class="pageStyle['failed']">生成失败，请稍后重试</view>
        <view v-else :class="pageStyle['processing']">
          <Refresh :class="pageStyle['spin']" />
          <text>{{ statusText }}</text>
        </view>
      </view>

      <view v-if="message.imageUrl" :class="pageStyle['card']">
        <view :class="pageStyle['imageShell']">
          <image :src="message.imageUrl" mode="aspectFill" :class="pageStyle['image']" />
          <image
            v-if="message.underImageUrl"
            :src="message.underImageUrl"
            mode="aspectFill"
            :class="[pageStyle['image'], pageStyle['underImage'], showUnderImage ? pageStyle['underImageShow'] : '']"
          />
          <view :class="pageStyle['topActionBar']">
            <view
              v-if="message.underImageUrl"
              :class="[pageStyle['topAction'], pageStyle['compareAction']]"
              @touchstart="onComparePress"
              @touchend="onCompareRelease"
            >
              <IconFont font-class-name="iconfont" class-prefix="icon" name="duibifenxi" :class="pageStyle['topIcon']" />
            </view>
            <view :class="[pageStyle['topAction'], pageStyle['downloadAction']]" @click="emit('download', message)">
              <Download :class="pageStyle['topIcon']" />
            </view>
            <view
              :class="[pageStyle['topAction'], pageStyle['publishAction'], message.isPublished ? pageStyle['publishDisabled'] : '']"
              @click="onPublish"
            >
              <IconFont font-class-name="iconfont" class-prefix="icon" name="fabu" :class="pageStyle['topIcon']" />
            </view>
          </view>
        </view>
        <view :class="pageStyle['content']">
          <view :class="pageStyle['actionRow']">
            <text :class="pageStyle['time']">{{ message.createdTime }}</text>
            <view :class="pageStyle['group']">
              <view :class="pageStyle['action']" @click="emit('like', message)">
                <IconFont
                  font-class-name="iconfont"
                  class-prefix="icon"
                  name="icon_love_hover"
                  :class="[pageStyle['icon'], message.isLiked ? pageStyle['iconLiked'] : '']"
                />
                <text>点赞</text>
              </view>
              <view :class="pageStyle['action']" @click="emit('regenerate', message)">
                <Refresh :class="pageStyle['icon']" />
                <text>重试</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import Taro from "@tarojs/taro";
import { Download, Refresh, IconFont } from "@nutui/icons-vue-taro";
import type { IServiceInfoProps } from "./const";
import type { IDrawingV2Message } from "@/pages/DrawingV2/const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IServiceInfoProps>(), {} as IServiceInfoProps);
const showUnderImage = ref(false);
const displayProgress = ref(0);
const progressTimer = ref<number | null>(null);

const emit = defineEmits<{
  like: [message: IDrawingV2Message];
  publish: [message: IDrawingV2Message];
  regenerate: [message: IDrawingV2Message];
  download: [message: IDrawingV2Message];
}>();

const clearProgressTimer = () => {
  if (progressTimer.value !== null) {
    clearInterval(progressTimer.value);
    progressTimer.value = null;
  }
};

// 进度文本做平滑递增，避免轮询时数字跳变
const animateProgressTo = (target: number) => {
  const safeTarget = Math.max(0, Math.min(100, Math.round(target || 0)));
  clearProgressTimer();
  if (safeTarget <= displayProgress.value) {
    displayProgress.value = safeTarget;
    return;
  }
  progressTimer.value = setInterval(() => {
    if (displayProgress.value >= safeTarget) {
      clearProgressTimer();
      return;
    }
    const step = Math.max(1, Math.ceil((safeTarget - displayProgress.value) / 8));
    displayProgress.value = Math.min(safeTarget, displayProgress.value + step);
  }, 30) as unknown as number;
};

const statusText = computed(() => {
  if (props.message.status === "INITIATED" || props.message.status === "PENDING") {
    return "任务创建中...";
  }
  return `正在为您构思设计方案...${Math.round(displayProgress.value)}%`;
});

watch(
  () => props.message.progress,
  (value) => {
    animateProgressTo(Number(value || 0));
  },
  { immediate: true },
);

watch(
  () => props.message.status,
  (status) => {
    if (status === "COMPLETED") {
      displayProgress.value = 100;
      clearProgressTimer();
      return;
    }
    if (status === "INITIATED" || status === "PENDING") {
      displayProgress.value = 0;
      clearProgressTimer();
    }
  },
  { immediate: true },
);

const onComparePress = () => {
  if (!props.message.underImageUrl) {
    Taro.showToast({ title: "没有底图无法对比", icon: "none" });
    showUnderImage.value = false;
    return;
  }
  showUnderImage.value = true;
};

const onCompareRelease = () => {
  showUnderImage.value = false;
};

const onPublish = () => {
  if (props.message.isPublished) {
    Taro.showToast({ title: "已经发布", icon: "none" });
    return;
  }
  emit("publish", props.message);
};

onUnmounted(() => {
  clearProgressTimer();
});
</script>
