<template>
  <Layouts>
    <view :class="styles.container">
      <view :class="styles.progressCircle">
        <svg :class="styles.circleSvg" viewBox="0 0 100 100">
          <circle :class="styles.bg" cx="50" cy="50" r="44" />
          <circle
            :class="styles.progress"
            cx="50"
            cy="50"
            r="44"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <view :class="styles.percentText">
          {{ progress }}<text :class="styles.symbol">%</text>
        </view>
      </view>

      <view :class="styles.statusText">正在进行AI风水检测</view>
      <view :class="styles.descText">AI正在深度解析房间布局、光影与方位...</view>

      <view :class="styles.bottomBar">
        <view :class="styles.barInner" :style="{ width: progress + '%' }"></view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Taro, { useRouter } from '@tarojs/taro';
import Layouts from '@/components/Layouts/index.vue';
import styles from './index.module.less';

const router = useRouter();
const progress = ref(0);
const timer = ref<any>(null);

// SVG 圆环参数
const radius = 44;
const circumference = 2 * Math.PI * radius;
const dashOffset = computed(() => {
  return circumference - (progress.value / 100) * circumference;
});

const startProgress = () => {
  // 模拟进度条
  // 前 80% 快速，后 20% 慢速，最后跳转
  timer.value = setInterval(() => {
    if (progress.value < 80) {
      progress.value += 2;
    } else if (progress.value < 99) {
      progress.value += 0.5;
    } else {
      clearInterval(timer.value);
      progress.value = 100;
      handleComplete();
    }
  }, 50);
};

const handleComplete = () => {
  setTimeout(() => {
    const taskId = router.params.taskId;
    Taro.redirectTo({
      url: `/pages/Fengshui/Report/index?taskId=${taskId}`
    });
  }, 500);
};

onMounted(() => {
  const taskId = router.params.taskId;
  if (!taskId) {
    Taro.showToast({ title: '任务不存在', icon: 'none' });
    setTimeout(() => Taro.navigateBack(), 1500);
    return;
  }
  startProgress();
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>
