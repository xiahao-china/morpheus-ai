<template>
  <Layouts>
    <view :class="styles.container" :style="{ height: `${containerHeight}px`}">
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
import { getFengshuiTaskStatus } from '@/api/fengshui';
import styles from './index.module.less';
import {getRemainingHeight} from "@/util/layout.ts";

const router = useRouter();
const progress = ref(0);
const targetProgress = ref(0);
const progressTimer = ref<number | null>(null);
const polling = ref<number | null>(null);
const containerHeight = ref(getRemainingHeight());

// SVG 圆环参数
const radius = 44;
const circumference = 2 * Math.PI * radius;
const dashOffset = computed(() => {
  return circumference - (progress.value / 100) * circumference;
});

const stopTimers = () => {
  if (progressTimer.value !== null) {
    clearInterval(progressTimer.value);
    progressTimer.value = null;
  }
  if (polling.value !== null) {
    clearInterval(polling.value);
    polling.value = null;
  }
};

const clearProgressTimer = () => {
  if (progressTimer.value !== null) {
    clearInterval(progressTimer.value);
    progressTimer.value = null;
  }
};

const animateProgressTo = (target: number, onDone?: () => void) => {
  const safeTarget = Math.max(0, Math.min(100, Math.round(Number(target) || 0)));
  targetProgress.value = Math.max(targetProgress.value, safeTarget);
  const finalTarget = targetProgress.value;

  clearProgressTimer();

  if (finalTarget <= progress.value) {
    progress.value = finalTarget;
    onDone?.();
    return;
  }

  progressTimer.value = setInterval(() => {
    if (progress.value >= finalTarget) {
      clearProgressTimer();
      onDone?.();
      return;
    }
    const step = Math.max(1, Math.ceil((finalTarget - progress.value) / 8));
    progress.value = Math.min(finalTarget, progress.value + step);
    if (progress.value >= finalTarget) {
      clearProgressTimer();
      onDone?.();
    }
  }, 30) as unknown as number;
};

const handleComplete = () => {
  if (polling.value !== null) {
    clearInterval(polling.value);
    polling.value = null;
  }
  animateProgressTo(100, () => {
    setTimeout(() => {
      const taskId = router.params.taskId;
      Taro.redirectTo({
        url: `/pages/Fengshui/Report/index?taskId=${taskId}`
      });
    }, 300);
  });
};

const pollTaskStatus = async (taskId: string) => {
  try {
    const statusRes = await getFengshuiTaskStatus(taskId);
    if (statusRes.status === 'completed') {
      handleComplete();
      return;
    }
    animateProgressTo(statusRes.progress);
    if (statusRes.status === 'failed') {
      stopTimers();
      Taro.showToast({ title: '任务失败，请重试', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1200);
    }
  } catch (err) {
    stopTimers();
    Taro.showToast({ title: '获取进度失败', icon: 'none' });
    setTimeout(() => Taro.navigateBack(), 1200);
  }
};

onMounted(() => {
  const taskId = router.params.taskId;
  if (!taskId) {
    Taro.showToast({ title: '任务不存在', icon: 'none' });
    setTimeout(() => Taro.navigateBack(), 1500);
    return;
  }
  pollTaskStatus(taskId);
  polling.value = setInterval(() => {
    pollTaskStatus(taskId);
  }, 1200);
});

onUnmounted(() => {
  stopTimers();
});
</script>
