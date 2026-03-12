<template>
  <div class="function-group-container">
    <div class="bottom-buttons">
      <ElButton
        v-for="item in CHANGE_IMG_FUNCTION_GROUP_MODE_MAP"
        :key="item.type"
        @click="handleButtonClick(item.type)"
        :class="{ 'selected': currentMode === item.type }"
      >
        <component class="function-icon" :is="item.icon" />
        {{item.label}}
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import {
  CHANGE_IMG_FUNCTION_GROUP_MODE_MAP,
  EFunctionGroupMode,
  type IFunctionGroupExpose
} from './const.ts';

// 当前使用的模式，默认设置为一键渲染
const currentMode = ref<EFunctionGroupMode>(EFunctionGroupMode.ONE_KEY_RENDER);

// 定义抛出事件
const emit = defineEmits<{
  'mode-change': [mode: EFunctionGroupMode];
}>();

// 处理按钮点击事件
const handleButtonClick = (mode: EFunctionGroupMode) => {
  // if (mode === EFunctionGroupMode.ONE_KEY_RENDER) {
  //   ElMessage.info('一键渲染功能暂未开放~敬请期待~');
  //   return;
  // }
  currentMode.value = mode;
  emit('mode-change', mode);
};

// 对外暴露设置当前模式的方法
defineExpose<IFunctionGroupExpose>({
  setCurrentMode: (mode: EFunctionGroupMode) => {
    currentMode.value = mode;
    emit('mode-change', mode);
  },
  getCurrentMode: () => currentMode.value
});
</script>

<style lang="less" scoped>
@import "./index.less";
/* 组件特定样式 */
</style>
