<template>
  <view :class="pageStyle['top-section']">
    <view v-if="props.generating" :class="pageStyle['progress-shell']">
      <view :class="pageStyle['loading-icon']"></view>
      <view :class="pageStyle['progress-track']">
        <view :class="pageStyle['progress-bar']" :style="{ width: props.progress + '%' }"></view>
      </view>
      <text :class="pageStyle['progress-text']">正在生成 {{ props.progress }}% {{props.progress === 100 ? '马上就好啦！' : ''}}</text>
    </view>
    <view v-else :class="pageStyle['preview-shell']">
      <image
        :src="displayUrl"
        :class="pageStyle['preview-image']"
        mode="aspectFit"
        @click="handlePreviewClick"
      />
      <image
        v-if="underImageUrl"
        :src="underImageUrl"
        :class="[pageStyle['preview-image'], pageStyle['under-image'], showUnderImage ? pageStyle['under-image-show'] : '']"
        mode="aspectFit"
        @click="handlePreviewClick"
      />
      <view :class="pageStyle['action-bar']">
        <nut-button
          shape="round"
          size="small"
          :class="pageStyle['action-button']"
          @touchstart="onComparePress"
          @touchend="onCompareRelease"
        >
          <IconFont :class="pageStyle['btn-icon']" font-class-name="iconfont" class-prefix="icon" name="duibifenxi" />
        </nut-button>
        <nut-button
          :class="pageStyle['action-button']"
          shape="round"
          size="small"
          open-type="share"
          @click="handleShare"
        >
          <IconFont :class="pageStyle['btn-icon']" font-class-name="iconfont" class-prefix="icon" name="fenxiang" />
        </nut-button>
        <nut-button
          :class="[pageStyle['action-button'], pageStyle['download-button']]"
          shape="round" size="small"
          @click="handleDownload"
        >
          <IconFont :class="pageStyle['btn-icon']" font-class-name="iconfont" class-prefix="icon" name="xiazai" />
        </nut-button>
      </view>
      <RootPortalEl>
        <nut-image-preview :show="showPreview" :images="previewList" @close="hidePreview" />
      </RootPortalEl>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import {IconFont} from '@nutui/icons-vue-taro'
import { ITopSectionProps, defaultTopProps, downloadImageByEnv, shareImageByEnv } from './const'
import pageStyle from './index.module.less'
import RootPortalEl from '@/components/RootPortalEl/index.vue'

const props = withDefaults(defineProps<ITopSectionProps>(), defaultTopProps)

const showUnderImage = ref<boolean>(false)
const displayUrl = computed(() => (showUnderImage.value && props.underImageUrl) ? props.underImageUrl : props.currentImageUrl)
const showPreview = ref(false)
const previewList = ref<{src:string}[]>([])

const onComparePress = () => {
  if (!props.underImageUrl) {
    Taro.showToast({ title: '没有底图无法对比', icon: 'none' })
    showUnderImage.value = false
    return
  }
  showUnderImage.value = true
}

const onCompareRelease = () => {
  showUnderImage.value = false
}

const handleDownload = async () => {
  if (!props.taskId) {
    Taro.showToast({ title: '缺少任务ID', icon: 'error' })
    return
  }
  try {
    await downloadImageByEnv(props.taskId)
  } catch {
    Taro.showToast({ title: '下载失败，请重试', icon: 'error' })
  }
}

const handleShare = async () => {
  try {
    await shareImageByEnv(props.currentImageUrl)
  } catch {
    Taro.showToast({ title: '分享失败', icon: 'error' })
  }
}

const hidePreview = () => {
  showPreview.value = false
}

const handlePreviewClick = () => {
  const list: string[] = []
  if (showUnderImage.value && props.underImageUrl) {
    list.push(props.underImageUrl)
    if (props.currentImageUrl) list.push(props.currentImageUrl)
  } else {
    if (props.currentImageUrl) list.push(props.currentImageUrl)
    if (props.underImageUrl) list.push(props.underImageUrl)
  }
  previewList.value = list.map(src => ({src}))
  showPreview.value = true
}
</script>

<style lang="less" scoped>
</style>
