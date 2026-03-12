<template>
  <div class="scale-type-container">
    <div class="title">放大类型</div>
    <div class="scale-type">
      <ElRadioGroup class="scale-radio-btn-group" v-model="selectedType">
        <ElRadioButton
          v-for="item in SCALE_TYPE_RADIO_GROUP"
          :label="item.label"
          :value="item.value"
          :key="item.value"
        />
      </ElRadioGroup>
    </div>
    <ElCollapse
      class="scale-detail-collapse"
      :model-value="selectedType === EScaleType.moreDetails ? ['1'] : undefined"
    >
      <ElCollapseItem  name="1">
        <div class="detail-supplement">
          <div class="progress-label">细节补充：</div>
          <div class="progress-slider">
            <ElSlider
              v-model="detailLevel"
              :min="0"
              :max="1"
              :step="0.01"
              disabled
              @change="updateDetailLevel"
            />
            <div class="level-tip">
              <div class="level-tip-info">低</div>
              <div class="level-tip-info">推荐</div>
              <div class="level-tip-info">高</div>
            </div>
          </div>

        </div>
      </ElCollapseItem>
    </ElCollapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElSlider, ElCollapse, ElCollapseItem, ElRadioGroup, ElRadioButton} from 'element-plus';
import type { Arrayable } from '@vueuse/core'
import { EScaleType, SCALE_TYPE_RADIO_GROUP, type IScaleTypeExpose } from './const.ts';

const selectedType = ref<EScaleType>(EScaleType.original); // 选中的放大类型
const detailLevel = ref(0.5); // 细节程度
// const isCollapsed = ref(false); // 折叠状态



// 更新放大类型
const updateScaleType = (type: EScaleType) => {
  if (type === EScaleType.original || type === EScaleType.moreDetails) {
    selectedType.value = type;
  }
};

// 更新细节程度
const updateDetailLevel = (level: Arrayable<number>) => {
  if (level as number >= 0 && level as number <= 1)
    detailLevel.value = level as number;
};


// 获取参数内容
const getParams = () => {
  return {
    scaleType: selectedType.value,
    detailLevel: selectedType.value === EScaleType.moreDetails ? detailLevel.value : undefined
  };
};



// 暴露方法
defineExpose<IScaleTypeExpose>({
  updateScaleType,
  updateDetailLevel,
  getParams
});
</script>

<style lang="less" scoped>
@import "./index.less";
</style>
