<template>
  <view :class="pageStyle['myInfo']">
    <view :class="pageStyle['bubble']">
      <image v-if="uploadImageUrl" :src="uploadImageUrl" mode="aspectFill" :class="pageStyle['uploadImage']" />
      <view v-if="content" :class="pageStyle['content']">{{ content }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { IMyInfoProps } from "./const";
import pageStyle from "./index.module.less";

withDefaults(defineProps<IMyInfoProps>(), {
  content: "",
  uploadImageUrl: "",
});
</script>
