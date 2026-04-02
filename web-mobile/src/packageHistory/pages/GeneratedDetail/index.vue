<template>
  <Layouts >
    <view :class="pageStyle['generated-detail-container']">
      <TopSection
        :generating="generating"
        :progress="progress"
        :current-image-url="currentImageUrl"
        :under-image-url="underImageUrl"
        :task-id="taskId"
      />
      <BottomSection :details="details" />
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue'
import Taro from '@tarojs/taro'
import Layouts from '@/components/Layouts/index.vue'
import {createGenerateTask} from '@/api/images/createGenerateTaskStream'
import { getGenerationsDetail } from '@/api/images/getGenerationHistoryDetail'
import {getGenerateProgress} from "@/api/generate/getGenerateProgress";
import TopSection from './components/TopSection/index.vue'
import BottomSection from './components/BottomSection/index.vue'
import { DEFAULT_DETAILS } from './const'
import pageStyle from './index.module.less'

const generating = ref(false)
const progress = ref(0)
const taskId = ref<string>('')
const currentImageUrl = ref<string>('')
const underImageUrl = ref<string>('')

const details = ref(DEFAULT_DETAILS)

let timeout: undefined | NodeJS.Timeout ;

const initFromRoute = () => {
  const params = (Taro.getCurrentInstance()?.router?.params || {}) as any
  if (params.taskId) {
    taskId.value = params.taskId.toString()
  }
  if (!taskId.value) {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const options = (currentPage as any).options || {}
      if (options.taskId) {
        taskId.value = options.taskId.toString()
      }
    }
  }
}

const startStream = () => {
  if (!taskId.value) return
  generating.value = true
  progress.value = 0
  createGenerateTask(taskId.value)
  timeout = setInterval(async () => {
    const response = await getGenerateProgress(taskId.value);
    if (response instanceof Error || response.code !== 200) {
      console.error(response)
      return
    }
    progress.value = Math.round(response.data.progress)
    if (response.data.status === 'COMPLETED') {
      clearInterval(timeout);
      timeout = undefined;
      progress.value = 100;
      currentImageUrl.value = response.data.imageUrl || '';
      generating.value = false;
      // prefetchDetail();
    } else if (response.data.status === 'FAILED' || response.data.status === 'CANCEL') {
      clearInterval(timeout);
      timeout = undefined;
      generating.value = false;
      Taro.showToast({ title: '图片生成失败', icon: 'error' });
    }
  }, 1000 * 3);
}

const prefetchDetail = async () => {
  if (!taskId.value) return
  const resp = await getGenerationsDetail(taskId.value)
  if (resp instanceof Error || resp.code !== 200 || !resp.data) {
    Taro.showToast({ title: '获取任务详情失败', icon: 'error' })
    generating.value = false
    return
  }
  const d = resp.data
  // 预填充基础信息
  underImageUrl.value = d.underImageUrl || underImageUrl.value
  details.value.prompt = d.prompt || details.value.prompt
  details.value.count = d.count || details.value.count
  details.value.ratio = d.ratio || details.value.ratio
  details.value.width = d.width || details.value.width
  details.value.height = d.height || details.value.height
  details.value.mode = (d.type as any) || details.value.mode

  if (d.status === 'COMPLETED') {
    currentImageUrl.value = d.imageUrl || (d.images && d.images.length > 0 ? d.images[0].imageUrl : '')
    generating.value = false
    progress.value = 100
  } else if (d.status === 'FAILED' || d.status === 'CANCEL') {
    generating.value = false
    progress.value = 0
    Taro.showToast({ title: '图片生成失败', icon: 'error' })
  } else {
    startStream()
  }
}


onMounted(() => {
  initFromRoute()
  if (!taskId.value) {
    Taro.showToast({ title: '缺少 taskId', icon: 'error' })
    return
  }
  prefetchDetail()
})

onUnmounted(() => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
})


definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>

<style lang="less" scoped>
</style>
