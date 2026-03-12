<template>
  <div class="re-draw-style">
    <div class="title">风格设置</div>
    <ElRadioGroup class="re-draw-radio-btn-group" v-model="reDrawStyleradio" >
      <ElRadioButton
        v-for="item in RE_DRAW_STYLERADIO_GROUP"
        :label="item.label"
        :value="item.value"
        :key="item.value"
        :disabled="item.disabled"
      />
    </ElRadioGroup>
    <ElCollapse class="re-draw-collapse" :model-value="reDrawStyleradio === EReDrawStyle.CUSTOM ? ['1'] : undefined" >
      <ElCollapseItem  name="1">
        <StyleSetting ref="styleSettingRef" />
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElRadioGroup, ElRadioButton, ElCollapse, ElCollapseItem } from 'element-plus';
import StyleSetting from '@/pages/app/components/StyleSetting/index.vue';
import { EReDrawStyle, RE_DRAW_STYLERADIO_GROUP, type IReDrawStyleInfo } from '@/pages/CarefullyReviseTheImage/components/ReDrawStyle/const.ts'

const reDrawStyleradio = ref<EReDrawStyle>(EReDrawStyle.ORIGINAL);
const styleSettingRef = ref();

// 获取重绘风格信息
const getReDrawStyleInfo = (): IReDrawStyleInfo => {
  if (reDrawStyleradio.value === EReDrawStyle.CUSTOM && styleSettingRef.value) {
    return {
      reDrawStyle: reDrawStyleradio.value,
      styleModelId: styleSettingRef.value.selectedStyleModel,
      styleExtractionLevelOutward: styleSettingRef.value.referenceStrength
    };
  }
  return {
    reDrawStyle: reDrawStyleradio.value
  };
};

// 对外暴露方法
defineExpose({
  getReDrawStyleInfo
});
</script>

<style lang="less" scoped>
@import "./index.less";
</style>
