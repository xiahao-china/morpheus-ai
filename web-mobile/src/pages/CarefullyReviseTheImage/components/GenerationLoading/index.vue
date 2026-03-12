<template>
  <div class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-icon">
        <svg class="icon-blue" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    <div class="loading-text">
      <div class="loading-title">
        {{currentGenerationId ? genProgress === 100 ? '即将完成~请稍作等待~' : `正在生成图片(${genProgress}%)` : `正在为您创建任务~`}}
      </div>
      <div class="loading-subtitle">请稍候，AI正在为您创作</div>
    </div>
    <div class="loading-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
    <ElButton class="cancel-button" :disabled="!currentGenerationId" type="info" @click="onCancel">取消生成</ElButton>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus'
defineProps<{
  genProgress: number;
  currentGenerationId: string;
}>();

// 定义抛出事件
const emit = defineEmits<{
  'cancel': [];
}>();

// 处理取消生成事件
const onCancel = async () => {
  emit('cancel');
};
</script>

<style lang="less" scoped>
@import "./index.less";
/* 组件特定样式 */
</style>
