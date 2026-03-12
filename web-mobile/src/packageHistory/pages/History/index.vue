<template>
  <Layouts>
    <view :class="pageStyle['history-container']">
      <HistoryList @openDetail="handleOpenDetail" />
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import Layouts from '@/components/Layouts/index.vue'
import HistoryList from './components/HistoryList/index.vue'
import pageStyle from './index.module.less'
import { navigateToGeneratedDetail } from './const'
const handleOpenDetail = (data: { taskId: string }) => {
  navigateToGeneratedDetail(data.taskId)
}

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>

<style lang="less" scoped>
</style>
