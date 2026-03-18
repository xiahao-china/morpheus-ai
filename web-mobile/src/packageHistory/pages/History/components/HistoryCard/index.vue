<template>
  <view :class="pageStyle['card']" @click="$emit('click')">
    <view :class="pageStyle['thumb-shell']">
      <image :src="info.imageUrl" :class="pageStyle['thumb']" mode="aspectFill" />
      <view :class="pageStyle['ratio']">{{ info.ratioText }}</view>
    </view>
    <view :class="pageStyle['content']">
      <view :class="pageStyle['top-row']">
        <view :class="pageStyle['title']">{{ info.title }}</view>
        <view :class="pageStyle['status']">{{ info.statusText }}</view>
      </view>
      <view :class="pageStyle['desc']">{{ info.desc || '暂无描述' }}</view>
      <view :class="pageStyle['bottom-row']">
        <view :class="pageStyle['time']">{{ info.timeText }}</view>
        <view :class="pageStyle['more']">···</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import pageStyle from './index.module.less'
import type { IHistoryCardInfo } from './const'

defineProps<{ info: IHistoryCardInfo }>()
</script>

<style lang="less" scoped>
</style>
