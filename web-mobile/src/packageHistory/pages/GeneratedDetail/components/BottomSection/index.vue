<template>
  <view :class="pageStyle['bottom-section']">
    <view :class="pageStyle['sheet-handle']"></view>

    <view :class="pageStyle['section']">
      <text :class="pageStyle['section-title']">参数详情</text>
      <view :class="pageStyle['params-grid']">
        <view :class="pageStyle['param-card']">
          <text :class="pageStyle['param-label']">比例</text>
          <text :class="pageStyle['param-value']">{{
            ratioDisplay || "—"
          }}</text>
        </view>
        <view :class="pageStyle['param-card']">
          <text :class="pageStyle['param-label']">数量</text>
          <text :class="pageStyle['param-value']">{{
            props.details.count
          }}</text>
        </view>
      </view>
      <view :class="pageStyle['engine-pill']">
        <view :class="pageStyle['status-dot']"></view>
        {{ modeLabel || "生成引擎" }}
      </view>
    </view>

    <view :class="pageStyle['section']">
      <text :class="pageStyle['section-title']">提示词</text>
      <view :class="pageStyle['prompt-box']">{{ promptDisplay }}</view>
    </view>

    <view :class="pageStyle['section']" v-if="details.underImageUrl">
      <text :class="pageStyle['section-title']">参考图</text>
      <view :class="pageStyle['prompt-box']">
        <image :src="details.underImageUrl" :class="pageStyle['under-image']" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DEFAULT_DETAILS } from "@/packageHistory/pages/GeneratedDetail/const";
import {
  IBottomSectionProps,
  computeModeLabel,
  computeRatioDisplay,
} from "./const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IBottomSectionProps>(), {
  details: DEFAULT_DETAILS,
});

const modeLabel = computed(() => computeModeLabel(props.details.mode));
const ratioDisplay = computed(() => computeRatioDisplay(props.details));
const promptDisplay = computed(() =>
  props.details.prompt ? props.details.prompt : "未提供提示词"
);
</script>

<style lang="less" scoped></style>
