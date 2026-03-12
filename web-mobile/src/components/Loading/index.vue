<template>
  <RootPortalEl>
    <view v-show="visible" :class="pageStyle['loading-overlay']">
      <view :class="pageStyle['card']">
        <view :class="pageStyle['spinner']" />
        <text :class="pageStyle['text']">{{ text }}</text>
      </view>
    </view>
  </RootPortalEl>
 </template>

<script setup lang="ts">
import { withDefaults } from 'vue'
import RootPortalEl from '@/components/RootPortalEl/index.vue'
import pageStyle from './index.module.less'
import type { ILoadingProps } from './const'

withDefaults(defineProps<ILoadingProps>(), {
  visible: true,
  text: 'LOADING',
  blur: true,
})

</script>

<style lang="less" scoped>
</style>

