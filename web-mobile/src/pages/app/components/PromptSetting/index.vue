<template>
  <div :class="styles.promptSetting" style="padding: 0;margin: 0;">
    <nut-form label-position="top" star-position="right" :class="styles.form">
      <nut-form-item :class="styles.formItem">
        <PromptWriter
          v-model="positivePrompt"
          title="正向提示词"
          placeholder="请输入正向提示词，描述您想要生成的内容..."
        />
      </nut-form-item>

      <!-- 负向提示词 -->
      <nut-form-item label="负向提示词" prop="negativePrompt" :class="styles.formItem">
        <nut-textarea
          v-model="negativePrompt"
          :class="styles.textarea"
          placeholder="请输入负向提示词，描述您不想要的内容..."
          :rows="3"
          :max-length="500"
          show-word-limit
        />

        <!-- 负向提示词的按钮组放在右边 -->
        <div :class="styles.negativeButtonSection">
          <div :class="styles.negativeButtons">
            <div
              :class="styles.actionBtn"
              @click="generateRandom"
            >
              <Refresh size="24" color="#64748b" />
            </div>
            <div
              :class="styles.actionBtn"
              @click="uploadImage"
            >
              <Photograph size="24" color="#64748b" />
            </div>
            <div
              :class="styles.actionBtn"
              @click="clearPrompt('negative')"
            >
              <Del size="24" color="#64748b" />
            </div>
          </div>
        </div>
      </nut-form-item>
    </nut-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Refresh, Photograph, Del } from '@nutui/icons-vue-taro'
import PromptWriter from '@/pages/app/components/PromptWriter/index.vue'
import styles from './index.module.less'

// 提示词数据
const positivePrompt = ref<string>('')
const negativePrompt = ref<string>('')

// 随机生成提示词（暂时不实现逻辑）
const generateRandom = () => {
  console.log('随机生成提示词')
}

// 上传图片生成提示词（暂时不实现逻辑）
const uploadImage = () => {
  console.log('上传图片生成提示词')
}

// 清除提示词
const clearPrompt = (type: 'positive' | 'negative') => {
  if (type === 'positive') {
    positivePrompt.value = ''
  } else {
    negativePrompt.value = ''
  }
  console.log(`清除${type === 'positive' ? '正向' : '负向'}提示词`)
}
</script>