<template>
  <!-- 使用view替代section标签，适配小程序 -->
  <view :class="styles.stats">
    <view :class="styles.container">
      <view :class="styles.statsGrid">
        <view
          v-for="(stat, index) in stats"
          :key="index"
          :class="styles.statItem"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <view :class="styles.statIcon" :style="{ background: stat.gradient }">
            <view v-html="stat.icon"></view>
          </view>
          <view :class="styles.statContent">
            <text :class="styles.statNumber" :style="{ color: stat.color }">
              {{ stat.number }}
            </text>
            <text :class="styles.statLabel">{{ stat.label }}</text>
            <text :class="styles.statDescription">{{ stat.description }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Taro from '@tarojs/taro';
import { STATS_STATIC_DATA } from './const';

// 导入 CSS Module 样式
import styles from './index.module.less';

const stats = ref(STATS_STATIC_DATA);

/**
 * 处理统计项点击事件
 * @param stat 统计项数据
 */
const handleStatTap = (stat: any) => {
  // 显示详细信息的提示
  Taro.showModal({
    title: stat.label,
    content: `${stat.description}\n\n当前数据：${stat.number}`,
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#2D5CF2'
  });

  // 可以根据需要跳转到对应的详情页面
  // Taro.navigateTo({
  //   url: `/pages/stats/detail?type=${stat.label}`
  // });
};
</script>
