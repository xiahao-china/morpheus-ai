<template>
  <view :class="styles['user-info-card']">
    <view :class="styles['left']">
      <image :class="styles['avatar']" :src="user.avatar || DEFAULT_USER_INFO.avatar" mode="aspectFill" />
      <view :class="styles['info']">
        <text :class="styles['nickname']">{{ user.username || user.nickname || DEFAULT_USER_INFO.username }}</text>
        <text :class="styles['date']">更新于 {{ updateTime }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { DEFAULT_USER_INFO } from '../UserAndWorkInfo/const';
import styles from './index.module.less';

defineProps<{
  user: {
    avatar: string;
    username: string;
    nickname?: string;
  };
  updateTime: string;
}>();
</script>
