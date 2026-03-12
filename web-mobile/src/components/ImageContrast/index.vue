<template>
  <view
    :class="[pageStyle['image-contrast'], { [pageStyle['loading']]: imageLoading }]"
    ref="imageContrastShellRef"
  >
    <image
      ref="imageContrastRef"
      :class="[pageStyle['image-contrast-bg'], 'inline-flex']"
      :src="props.contrastImageUrl"
      mode="aspectFit"
      @load="handleImageLoad"
      @click="onClickCenterBlock"
    />
    <view
      ref="frontendElShell"
      id="frontendElShell"
      :class="[pageStyle['image-contrast-frontend'], 'inline-flex', backgroundIsWidthImage ? pageStyle['width-image-contrast-frontend'] : pageStyle['height-image-contrast-frontend']]"
      :style="{
        backgroundImage: `url(${props.originImageUrl})`,
        opacity: showContrast ? 1 : 0,
        zIndex: showContrast ? 0 : -1,
      }"
    >
      <image
        :class="[pageStyle['image-contrast-frontend-img'], 'inline-flex', 'opacity-0']"
        :src="props.originImageUrl"
        @error="handleImageError"
        mode="aspectFit"
      />
    </view>
    <view
      ref="splitElShell"
      @touchstart="startDrag"
      :class="pageStyle['split-el-shell']"
      :style="{
        opacity: showContrast ? 1 : 0,
        zIndex: showContrast ? undefined : -1,
      }"
    >
      <view :class="pageStyle['split-el']" />
    </view>
    <view v-if="!showContrast" :class="pageStyle['arrow-options']">
      <view v-show="props.canUseLeftArrow" :class="pageStyle['arrow-left']" @click="onLeftArrowClick">
        <ChevronLeft/>
      </view>
      <view :class="pageStyle['center-block']" @click="onClickCenterBlock"/>
      <view v-show="props.canUseRightArrow" :class="pageStyle['arrow-right']" @click="onRightArrowClick">
        <ChevronRight/>
      </view>
    </view>

    <!-- 加载状态覆盖层 -->
    <view v-if="imageLoading" :class="pageStyle['loading-overlay']">
      <view :class="pageStyle['loading-spinner']"></view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Taro from '@tarojs/taro'
import { debounce, loadImageOriginSize } from '@/constants/util'
import {ChevronLeft, ChevronRight} from '@/components/Icons'
import type { IImageContrastProps } from './const'
import {IObject} from "@/constants/types";
import pageStyle from './index.module.less';

const emit = defineEmits<{
  pre: [],
  nxt: [],
}>()

const props = withDefaults(defineProps<IImageContrastProps>(), {
  originImageUrl: '',
  contrastImageUrl: '',
  canUseLeftArrow: false,
  canUseRightArrow: false,
})

const imageContrastRef = ref<any>(null);
const imageContrastShellRef = ref<any>(null);

const showContrast = ref<boolean>(false);
const imageLoading = ref(false);

const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const containerWidth = ref(0)
const splitElShell = ref<any>(null)
const frontendElShell = ref<any>(null)
const backgroundIsWidthImage = ref<boolean>(true);
let imageOffsetX = 0;

const handleImageLoad = () => {
  imageLoading.value = false;
  // 图片加载完成，不需要特殊处理
  // if (splitElShell.value) {
  //   containerWidth.value = splitElShell.value.parentElement?.offsetWidth || 0
  //   currentX.value = splitElShell.value.offsetLeft
  // }
  // if (frontendElShell.value) {
  //   frontendElShell.value.style.left = `${currentX.value + 12}px`
  //   frontendElShell.value.style.backgroundPositionX = `-${currentX.value + 12 - imageOffsetX}px`
  // }
}

const handleImageError = () => {
  // console.error('图片加载失败')
}

const startDrag = (event: TouchEvent) => {
  isDragging.value = true
  startX.value = event.touches[0].clientX
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', stopDrag)
}

const drag = (event: TouchEvent) => {
  if (!isDragging.value) return
  const clientX = event.touches[0].clientX
  const deltaX = clientX - startX.value;
  const calcX = Math.min(Math.max(0, currentX.value + deltaX), containerWidth.value);
  if (Math.abs(calcX) > containerWidth.value - 12 - imageOffsetX) return;
  if (Math.abs(calcX) < Math.abs(imageOffsetX)-12) return;
  currentX.value = calcX;
  if (splitElShell.value) {
    splitElShell.value.style.left = `${currentX.value}px`
  }
  if (frontendElShell.value) {
    frontendElShell.value.style.left = `${currentX.value + 12}px`
    frontendElShell.value.style.backgroundPositionX = `-${currentX.value + 12 - imageOffsetX}px`
  }
  startX.value = clientX
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', drag)
  document.removeEventListener('touchend', stopDrag)
}

onMounted(() => {
  // 监听窗口大小变化
  Taro.onWindowResize(handleResize)
})

onUnmounted(() => {
  document.removeEventListener('touchmove', drag)
  document.removeEventListener('touchend', stopDrag)
  // 移除窗口大小变化监听
  Taro.offWindowResize(handleResize)
})

const changeShowContrast = (show:boolean)=>{
  showContrast.value = show;
}

const calcImagePos = async (url:string) => {
  imageOffsetX = 0;
  const size = await loadImageOriginSize(url);
  let wVal = size.width;
  let hVal = size.height;
  if (imageContrastShellRef.value) {
    wVal = size.width / imageContrastShellRef.value.offsetWidth;
    hVal = size.height / imageContrastShellRef.value.offsetHeight;
  }

  backgroundIsWidthImage.value = wVal >= hVal;

  if (frontendElShell.value) {
    if (wVal >= hVal){
      imageOffsetX = 0;
      return;
    }
    const elQuery = Taro.createSelectorQuery();
    elQuery.select('#frontendElShell').boundingClientRect();
    const elSize = await elQuery.exec();
    const ratio = size.height / (elSize as IObject).height;
    imageOffsetX = ((elSize as IObject).width - size.width/ratio) / 2;
  }
}

watch(()=>props.contrastImageUrl, async (newVal) => {
  if (newVal) imageLoading.value = true;
  showContrast.value = false;
},{immediate: true})

watch(()=>props.originImageUrl, calcImagePos, {immediate: true})

const onLeftArrowClick = () => {
  emit('pre');
}

const onRightArrowClick = () => {
  emit('nxt');
}

const onClickCenterBlock = () => {
  // 在小程序环境中，可以使用Taro.previewImage来预览图片
  if (props.contrastImageUrl) {
    Taro.previewImage({
      urls: [props.contrastImageUrl],
      current: props.contrastImageUrl
    })
  }
}

const handleResize = debounce(async () => {
  if (props.originImageUrl) {
    await calcImagePos(props.originImageUrl);
  }
  handleImageLoad();
}, 100)

defineExpose({
  changeShowContrast
})

</script>

<style lang="less" scoped>
</style>
