<template>
  <Layouts>
    <view :class="styles.container">
      <view v-if="loading" :class="styles.state">加载中...</view>
      <view v-else-if="!list.length" :class="styles.state">暂无记录</view>
      <view v-else :class="styles.list">
        <view
          v-for="item in list"
          :key="item.taskId"
          :class="styles.card"
          @tap="openReport(item.taskId)"
        >
          <image :src="item.imageUrl" mode="aspectFill" :class="styles.thumb" />
          <view :class="styles.main">
            <view :class="styles.date">{{ formatDate(item.createdTime) }}</view>
            <view :class="styles.score">评分: {{ item.score }}</view>
            <view :class="styles.link">点击查看详细AI风水报告</view>
          </view>
          <view :class="[styles.level, styles[getLevelClass(item.level)]]">{{ item.level }}</view>
        </view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import Layouts from '@/components/Layouts/index.vue';
import { getFengshuiHistory, IFengshuiHistoryItem } from '@/api/fengshui';
import styles from './index.module.less';

const loading = ref(false);
const list = ref<IFengshuiHistoryItem[]>([]);

const formatDate = (date: string | Date) => dayjs(date).format('YYYY-MM-DD');
const getLevelClass = (level: string) => {
  if (level === '上吉' || level === '大吉') return 'levelBest';
  if (level === '吉') return 'levelGood';
  if (level === '中') return 'levelMedium';
  return 'levelLow';
};

const openReport = (taskId: string) => {
  Taro.navigateTo({
    url: `/pages/Fengshui/Report/index?taskId=${taskId}`
  });
};

const fetchHistory = async () => {
  loading.value = true;
  try {
    list.value = await getFengshuiHistory({ page: 1, pageSize: 50 });
  } catch (error) {
    Taro.showToast({ title: '获取历史失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchHistory();
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>
