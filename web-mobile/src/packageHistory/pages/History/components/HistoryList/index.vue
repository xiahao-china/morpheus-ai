<template>
  <scroll-view :class="[pageStyle['list'], isWeb ? pageStyle['web-list'] : undefined]" :scroll-y="true" @scrolltolower="loadMore">
    <view :class="pageStyle['list-content']">
      <HistoryCard
        v-for="(card, idx) in cards"
        :key="`${card.taskId}-${idx}`"
        :info="card"
        @click="() => emitOpenDetail(card)"
      />
      <view :class="pageStyle['status']">
        <text v-if="loading">加载中...</text>
        <text v-else-if="loadEnd">没有更多了</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { getRecentGenerationsV2 } from '@/api/images/getGenerationHistoryV2'
import HistoryCard from '../HistoryCard/index.vue'
import pageStyle from './index.module.less'
import type { IHistoryCardInfo } from '../HistoryCard/const'
import { mapToCards } from './const'
import {getIsWeb} from "@/util/envCheck";

const cards = ref<IHistoryCardInfo[]>([])
const pageNo = ref(0)
const loading = ref(false)
const loadEnd = ref(false)

const emit = defineEmits<{ openDetail: [data: { taskId: string }] }>();
const isWeb = getIsWeb();

const emitOpenDetail = (card: IHistoryCardInfo) => {
  emit('openDetail', { taskId: card.taskId })
}

// const fetchList = async () => {
//   if (loading.value || loadEnd.value) return
//   loading.value = true
//   pageNo.value += 1
//   const res = await getRecentGenerationsV2()
//   loading.value = false
//   if (res instanceof Error || res.code !== 200) {
//     Taro.showToast({ title: '加载失败', icon: 'error' })
//     return
//   }
//   if (!res.data.records.length) {
//     loadEnd.value = true
//     return
//   }
//   cards.value = cards.value.concat(mapToCards(res.data.records))
// }

const fetchAllList = async () => {
  if (loading.value || loadEnd.value) return
  loading.value = true
  const res = await getRecentGenerationsV2()
  loading.value = false
  if (res instanceof Error || res.code !== 200) {
    Taro.showToast({ title: '加载失败', icon: 'error' })
    return
  }
  cards.value = mapToCards(res.data.records);
  loadEnd.value = true
}

const loadMore = () => {
  fetchAllList()
}

onMounted(() => {
  fetchAllList()
})
</script>

<style lang="less" scoped>
</style>
