<template>
  <view :class="styles['description-card']">
    <view :class="styles['header']">
      <IconFont name="order" size="18" color="#7d5fff" />
      <text :class="styles['title']">作品简介</text>
    </view>
    <view :class="styles['content']">
      {{ description }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { IconFont } from '@nutui/icons-vue-taro';
import styles from './index.module.less';

defineProps<{
  description: string;
}>();
</script>
