<template>
  <view :class="pageStyle['add-custom-tag']">
    <Plus :class="[pageStyle['to-add'], {'active': !showInput}]" @click="showInput = true" />
    <view :class="[pageStyle['custom-input'], {'active': showInput}]">
      <nut-input
        v-model="customTag"
        placeholder="自定义内容"
        @confirm="handleAddCustomTag"
      />
      <nut-button
        type="primary"
        size="small"
        @click="handleAddCustomTag"
      >
        添加
      </nut-button>
    </view>
    <Close :class="pageStyle['to-close']" v-if="showInput" @click="showInput = false" />
  </view>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { Plus, Close } from '@nutui/icons-vue-taro';
import pageStyle from './index.module.less';

// 定义事件 emits
const emit = defineEmits<{
  save: [string]
}>();

const showInput = ref(false);
const customTag = ref('');

const handleAddCustomTag = ()=>{
  if (!customTag.value) {
    emit('save', customTag.value);
    return;
  }
  emit('save', customTag.value);
  customTag.value = '';
  showInput.value = false;
}


</script>

<style lang="less" scoped>
</style>
