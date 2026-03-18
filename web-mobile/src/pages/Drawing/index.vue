<template>
  <Layouts>
    <view :class="pageStyle['drawing-container']">
      <ImageUpload ref="imageUploadRef" @loaded="handleLoaded" @clear="handleImageClear" />
      <SceneSelect ref="sceneSelectRef" @change="handleSceneChange" />
      <StyleSelect ref="styleSelectRef" @change="handleStyleChange" />
      <PromptWriter
        ref="promptWriterRef"
        @change="handlePromptChange"
        :scene="drawingInfo.scene"
        :designStyle="drawingInfo.style"
      />
      <view :class="pageStyle['polish-action']">
        <nut-button
          :class="pageStyle['history-action-btn']"
          size="normal"
          @click="handleToHistory"
        >
          <view :class="pageStyle['history-icon-content']">
            <IconFont :class="pageStyle['history-icon']" font-class-name="iconfont" class-prefix="icon" name="history" />
          </view>
        </nut-button>

        <nut-button
          :class="pageStyle['polish-action-btn']"
          type="primary"
          size="normal"
          :loading="loading"
          @click="handlePolish"
        >
          立即生成
        </nut-button>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
import Taro from "@tarojs/taro";
import Layouts from '@/components/Layouts/index.vue';
import {IconFont} from "@nutui/icons-vue-taro";
import {cloneDeep} from "@/util/cloneDeep";
import { DEFAULT_DRAWING_PROPS } from "@/pages/Drawing/const";
import { getImagesTask, EDrawingType } from "@/api/generate/workStream";
import ImageUpload from './components/ImageUpload/index.vue';
import SceneSelect from './components/SceneSelect/index.vue';
import StyleSelect from './components/StyleSelect/index.vue';
import PromptWriter from './components/PromptWriter/index.vue';
import type { IPromptWriterExpose } from './components/PromptWriter/const';
import pageStyle from './index.module.less';
import {IStyleSelectExpose} from "@/pages/Drawing/components/StyleSelect/const";
import {ISceneSelectExpose} from "@/pages/Drawing/components/SceneSelect/const";


const drawingInfo = ref(cloneDeep(DEFAULT_DRAWING_PROPS));
const loading = ref(false);
const promptWriterRef = ref<IPromptWriterExpose | null>(null);
const imageUploadRef = ref<any>(null);
const sceneSelectRef = ref<ISceneSelectExpose | null>(null);
const styleSelectRef = ref<IStyleSelectExpose | null>(null);



const handleLoaded = (url: string, id: string, width: number, height: number) => {
  drawingInfo.value.imgUrl = url;
  drawingInfo.value.imgId = id;
  drawingInfo.value.width = width || 0;
  drawingInfo.value.height = height || 0;
}

const handleSceneChange = (scene: string) => {
  drawingInfo.value.scene = scene;
}

const handleStyleChange = (style: string) => {
  drawingInfo.value.style = style;
}

const handlePromptChange = (prompt: string) => {
  drawingInfo.value.prompt = prompt;
}

const handleImageClear = () => {
  drawingInfo.value.imgUrl = '';
  drawingInfo.value.imgId = '';
  drawingInfo.value.width = 0;
  drawingInfo.value.height = 0;
}

const handlePolish = async () => {
  loading.value = true;
  try {
    if (!drawingInfo.value.prompt) {
      const polished = await promptWriterRef.value?.openAIPolish();
      if (polished) {
        drawingInfo.value.prompt = polished as string;
      }
    }

    let ratio: string | undefined = '1:1';
    let height: number | undefined = 1024;
    let width: number | undefined = 1024;
    let drawingType: EDrawingType = EDrawingType.INSPIRATION;
    let underImageId: string | number | undefined = undefined;

    if (drawingInfo.value.imgId) {
      // const res = await ocrDecoration({ fileId: drawingInfo.value.imgId });
      // if (res instanceof Error || res.code !== 200) {
      //   console.log('ocrDecoration error:', res);
      //   Taro.showToast({ title: '识别失败，请重试', icon: 'error' });
      //   return;
      // }
      // const ocrRes = res.data;
      // if (ocrRes === 'FINISHED') {
      //   drawingType = EDrawingType.LINEAR_RENDER;
      // } else {
      //   drawingType = EDrawingType.MAKE_UP;
      // }
      drawingType = EDrawingType.MAKE_UP;
      underImageId = drawingInfo.value.imgId;
      ratio = undefined;
      height = undefined;
      width = undefined;
    }

    // const w = drawingInfo.value.width || 1024;
    // const h = drawingInfo.value.height || 1024;
    const response = await getImagesTask({
      prompt: drawingInfo.value.prompt,
      count: 1,
      ratio,
      type: drawingType,
      base_images: underImageId ? [String(underImageId)] : undefined,
      height,
      width,
    });

    if (response instanceof Error || response.code !== 200) {
      console.log('getImagesTask error:', response);
      Taro.showToast({ title: '任务创建失败', icon: 'error' });
      return;
    }
    Taro.showToast({ title: '任务创建成功', icon: 'success' });
    const tid = response.data?.taskId ?? '';
    // 清理内容
    promptWriterRef.value?.clear();
    imageUploadRef.value?.reset();
    sceneSelectRef.value?.reset();
    styleSelectRef.value?.reset();
    drawingInfo.value = DEFAULT_DRAWING_PROPS;
    Taro.navigateTo({ url: `/packageHistory/pages/GeneratedDetail/index?taskId=${tid}` });
  } finally {
    loading.value = false;
  }
}

const handleToHistory = () => {
  Taro.navigateTo({ url: '/packageHistory/pages/History/index' });
}

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>

<style lang="less" scoped>
</style>
