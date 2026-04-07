<template>
  <scroll-view
    :class="[pageStyle['infinite-scroll'], customClass]"
    :style="{ height: `${scrollAreaHeight}px` }"
    :scroll-y="true"
    :show-scrollbar="false"
    :scroll-top="internalScrollTop"
    :scroll-into-view="internalScrollIntoView"
    :scroll-with-animation="scrollWithAnimation"
    :enhanced="true"
    :upper-threshold="50"
    :lower-threshold="50"
    @scrolltoupper="handleScrollToUpper"
    @scrolltolower="handleScrollToLower"
  >
    <view :class="pageStyle['infinite-scroll-content']">
      <!-- 向上滚动加载时的状态显示 -->
      <view v-if="direction === 'up'" :class="pageStyle['status']">
        <text v-if="loading">加载中...</text>
        <text v-else-if="loadEnd">没有更多了</text>
      </view>

      <slot />

      <!-- 向下滚动加载时的状态显示 -->
      <view v-if="direction === 'down'" :class="pageStyle['status']">
        <text v-if="loading">加载中...</text>
        <text v-else-if="loadEnd">没有更多了</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { withDefaults, ref, watch, onMounted, nextTick, computed } from 'vue';
import { type IInfiniteScrollProps, defaultInfiniteScrollProps } from './const';
import pageStyle from './index.module.less';
import { getScreenHeight } from '@/util/layout';

const props = withDefaults(defineProps<IInfiniteScrollProps>(), defaultInfiniteScrollProps);

const emit = defineEmits<{
  loadMore: [];
}>();

const scrollAreaHeight = computed(() => {
  return getScreenHeight() - 80;
});

const internalScrollTop = ref(props.scrollTop);
const internalScrollIntoView = ref('');
const scrollWithAnimation = ref(false);

const scrollToBottom = () => {
  // 设置一个极大的值，确保滚到最底部
  internalScrollTop.value = -1;
  console.log('scrollToBottom', internalScrollTop.value);
  nextTick(() => {
    internalScrollTop.value = 99999 + Math.random();
  });
};

const scrollToView = (id: string) => {
  internalScrollIntoView.value = id;
};

// 暴露方法给外部
defineExpose({
  scrollToBottom,
  scrollToView,
});

// 监听 props 变化
watch(() => props.scrollIntoView, (newVal) => {
  if (newVal) {
    nextTick(() => {
      internalScrollIntoView.value = newVal;
      // 开启后续滚动的动画
      scrollWithAnimation.value = true;
    });
  }
});

watch(() => props.scrollTop, (newVal) => {
  if (newVal !== undefined) {
    internalScrollTop.value = newVal;
  }
});

const handleScrollToUpper = () => {
  if (props.direction === 'up' && !props.loading && !props.loadEnd) {
    emit('loadMore');
  }
};

const handleScrollToLower = () => {
  if (props.direction === 'down' && !props.loading && !props.loadEnd) {
    emit('loadMore');
  }
};
</script>
