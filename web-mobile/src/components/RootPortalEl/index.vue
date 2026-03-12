<template>
  <view>
    <template v-if="isWeb">
      <slot></slot>
    </template>
    <root-portal v-else>
      <slot></slot>
    </root-portal>
  </view>
</template>

<script setup lang="ts">
import { getIsWeb } from "@/util/envCheck";

const isWeb = getIsWeb();
</script>

<style lang="less" scoped>
</style>
