<template>
  <view :class="pageStyle['prompt-writer-container']">
    <view :class="pageStyle['panel']">
      <view :class="pageStyle['panel-header']">
        <text :class="pageStyle['title']">{{ title }}</text>
        <nut-button
          :class="pageStyle['ai-btn']"
          size="normal"
          type="primary"
          :loading="loading"
          :disabled="loading"
          @click="openAIPolish"
        >
          <view :class="pageStyle['ai-btn-content']">
            <IconFont
              v-if="!loading"
              :class="pageStyle['sparkles-icon']"
              font-class-name="iconfont"
              class-prefix="icon"
              name="sparkles"
            />
            <view :class="pageStyle['btn-text']">优化提示词</view>
          </view>
        </nut-button>
      </view>
      <view :class="pageStyle['content']">
        <nut-textarea
          v-model="valueRef"
          :class="pageStyle['textarea']"
          :rows="4"
          :disabled="loading"
          :max-length="PROMPT_MAX_LENGTH"
          show-word-limit
          :placeholder="placeholder"
        />
      </view>
    </view>
  </view>
 </template>

<script setup lang="ts">
import { ref, watch, withDefaults } from 'vue'
import pageStyle from './index.module.less'
import {PROMPT_TITLE, PROMPT_PLACEHOLDER, PROMPT_MAX_LENGTH, PromptManager, IPromptWriterProps} from './const'
import { generatePrompt } from '@/api/generate/generatePrompt'
import {IconFont} from "@nutui/icons-vue-taro";

const props = withDefaults(defineProps<IPromptWriterProps>(), {
  modelValue: '',
  title: PROMPT_TITLE,
  placeholder: PROMPT_PLACEHOLDER,
  scene: '',
  designStyle: ''
})

const emit = defineEmits(['update:modelValue','change'])
const valueRef = ref(props.modelValue || '')
const manager = new PromptManager(valueRef.value)
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  valueRef.value = val || ''
  manager.update(valueRef.value)
})

watch(valueRef, (val) => {
  manager.update(val)
  emit('update:modelValue', val)
  emit('change', val)
})

const openAIPolish = async () => {
  if (loading.value) return
  loading.value = true

  const res = await generatePrompt({
    scene: props.scene || '',
    style: props.designStyle || '',
    frontPrompt: valueRef.value || ''
  })
  if (res instanceof Error || res.code !== 200) {
    console.log('润色失败', res)
    return;
  }
  const polished = PromptManager.clamp(String(res.data || ''), PROMPT_MAX_LENGTH)
  valueRef.value = polished

  loading.value = false;

  return polished;
}

const clear = () => {
  valueRef.value = ''
  manager.clear()
}

defineExpose({
  openAIPolish,
  clear,
})

</script>
