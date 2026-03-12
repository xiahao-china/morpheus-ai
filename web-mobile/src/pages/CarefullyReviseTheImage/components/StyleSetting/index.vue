<template>
  <div class="style-setting-container">
    <!-- 左侧：预览图片和数值显示 -->
    <div class="style-preview-section">
      <!-- 上部：选中模型的预览图片 -->
      <div class="style-select-container">
        <ElPopover ref="popoverRef" placement="right" title="" :width="474" :trigger="styleModels.length?'click':'focus'">
          <template #reference>
            <div class="preview-container" @click="handleClickEmptyPreview">
              <div class="preview-image-container" v-if="selectedModelImage">
                <ElImage
                  :src="selectedModelImage"
                  alt="风格预览"
                  class="preview-image"
                  fit="contain"
                  :preview-disabled="false"
                  :lazy="true"
                >
                  <template #error>
                    <div class="preview-container">
                      <ElImage src="/placeholder.svg" class="preview-image" fit="contain" />
                    </div>
                  </template>
                </ElImage>
                <button @click.stop="removeSelected" class="remove-selected" title="移除图片">
                  ×
                </button>
                <div class="reference-strength-title">
                  参考程度：{{ referenceStrength }}
                </div>
              </div>
              <div v-else class="empty-preview-text" >请选择风格模型</div>
            </div>
          </template>
          <template #default>
            <div class="style-list">
              <div
                class="style-item"
                v-for="model in styleModels"
                :key="model.id"
                @click="() => updateReferenceStrength(model)"
              >
                <ElImage
                  :src="model.iconUrl"
                  :alt="model.value"
                  class="style-option-image"
                  fit="cover"
                  :preview-disabled="true"
                >
                  <template #error>
                    <div class="preview-container">
                      <ElImage src="/placeholder.svg" class="style-option-image" fit="cover" />
                    </div>
                  </template>
                </ElImage>
                <ElTag class="style-option-text">{{ model.value }}</ElTag>
              </div>
            </div>
          </template>
        </ElPopover>
      </div>
    </div>
    <!-- 右侧：控制面板 -->
    <div class="style-control-section">
      <div class="style-control-section-top">
        <div class="style-model-name" :class="{disabled:!selectedStyleModel}">
          {{currentStyleInfo?.value ? `${currentStyleInfo?.value}模型` : '暂未选择'}}
        </div>
        <ElTooltip
          class="item"
          effect="dark"
          content="风格模型的参考程度越高，该风格效果的表现越强烈，参考程度越低，该风格效果的表现越弱"
          placement="top"
        >
          <ElIcon class="question-icon">
            <CircleQuestionMark/>
          </ElIcon>
        </ElTooltip>
      </div>
      <!-- 下部：参考程度滑块 -->
      <div class="reference-strength-container">
        <div class="slider-container">
          <span class="slider-label">0</span>
          <ElSlider
            v-model="referenceStrength"
            :disabled="!selectedStyleModel"
            :min="0"
            :max="1"
            :step="0.01"
            class="slider"
          />
          <span class="slider-label">1</span>
        </div>
        <div class="slider-tips">
          <span>弱参考</span>
          <span>强参考</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElSlider, ElImage, ElTooltip, ElPopover, ElMessage, ElIcon, ElTag } from 'element-plus';
import { ref, computed, watch, defineProps } from 'vue';
import {
  getChangeImageModelStyleModel,
  type StyleModelRecord
} from '@/api/system/config/getStyleModels';
import type { IObject } from '@/constants/types.ts'
import { CircleQuestionMark } from '@/components/Icons.ts';
import type { IStyleSettingExpose, IStyleSettingProps } from './const.ts';

const popoverRef = ref<IObject | null>(null);

// 待更新参数，避免基础模型重置导致的参数刷新问题
const updateWaitParams:IObject = {
  modelId: undefined,
  strength: undefined,
}

const styleModels = ref<StyleModelRecord[]>([])
const props = withDefaults(defineProps<IStyleSettingProps>(), {});

const selectedStyleModel = ref<number | undefined>(undefined);
const referenceStrength = ref<number>(0.5);

const removeSelected = ()=>{
  selectedStyleModel.value = undefined;
}

const currentStyleInfo = computed(() => {
  return styleModels.value.find((m) => m.id === selectedStyleModel.value);
});

watch(() => styleModels.value, (newVal)=>{
  const hasSelected = newVal.find(m => m.id === selectedStyleModel.value);
  console.log('hasSelected',hasSelected, selectedStyleModel.value);
  if (!hasSelected) removeSelected();
  if (updateWaitParams.modelId){
    selectedStyleModel.value = updateWaitParams.modelId;
    delete updateWaitParams.modelId;
  }
  if (updateWaitParams.strength){
    referenceStrength.value = updateWaitParams.strength;
    delete updateWaitParams.strength;
  }

}, { immediate: true });

const updateReferenceStrength = (item: StyleModelRecord) => {
  referenceStrength.value = parseFloat(item.defaultValue);
  selectedStyleModel.value = item.id;
  popoverRef.value?.hide();
};

// 根据选中的模型获取对应的图片
const selectedModelImage = computed(() => {
  const model = styleModels.value.find(m => m.id === selectedStyleModel.value);
  return model?.iconUrl || '';
});

const handleClickEmptyPreview = ()=>{
  if (!styleModels.value.length) {
    ElMessage.info('请先选择场景~');
  }
}

const updateStyleModelSelectedInfo = (modelId?: number | string, strength?:number, wait?:boolean) => {
  console.log('updateStyleModelSelectedInfo',modelId, strength, wait);
  if (wait){
    updateWaitParams.modelId = modelId ? parseInt(modelId.toString()) :undefined;
    updateWaitParams.strength = strength || 0.5;
  }
  selectedStyleModel.value = modelId ? parseInt(modelId.toString()) :undefined;
  referenceStrength.value = strength || 0.5;
};

const initStyleModels = async (concreteSceneId?:number) => {
  styleModels.value =[];
  if (!concreteSceneId) return;
  const response = await getChangeImageModelStyleModel(concreteSceneId,{
    pageNo: 1,
    pageSize: 999
  });
  if (response instanceof Error || response.code !== 200) {
    console.error(response);
    return;
  }
  styleModels.value = response.data.records.filter(m => m.isEnabled);
}

const validate = ()=>{
  if (!selectedStyleModel.value) {
    ElMessage.error('请选择风格模型');
    return false;
  }
  return true;
}

watch(()=>props.concreteSceneId, (newVal)=>{
  if (newVal) {
    initStyleModels(props.concreteSceneId);
  }
}, { immediate: true })

const getStyleModelSelectedInfo = ()=>{
  return {
    selectedStyleModel: selectedStyleModel.value,
    referenceStrength: referenceStrength.value,
  }
}

// 暴露数据给父组件
defineExpose<IStyleSettingExpose>({
  getStyleModelSelectedInfo,
  updateStyleModelSelectedInfo,
  validate,
});

</script>
<style lang="less" scoped>
@import "index.less";
</style>
