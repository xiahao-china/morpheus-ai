<template>
  <AppLayout>
    <div class="carefully-revise-container">
      <div class="left-panel">
        <div class="top-block">
          <FunctionGroup ref="functionGroupRef" @mode-change="onChangeCurrentMode" />
        </div>
        <div class="center-block">
          <UploadBaseImages
            ref="uploadBaseImagesRef"
            :title="currentFunctionGroupMode === EFunctionGroupMode.ALL_THINGS_TRANSFER ? '上传背景图' : '上传图片'"
            @change="onUploadImageChange"
            hide-compress-tip
          />

          <!--   一键渲染     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.ONE_KEY_RENDER">
            <CollapsiblePanel title="选择场景" not-collapsed>
              <ChoseScene ref="choseSceneRef" @chose-scene="(val)=>selectedSceneId=val"/>
            </CollapsiblePanel>
            <CollapsiblePanel title="风格模型" not-collapsed>
              <StyleSetting :concrete-scene-id="selectedSceneId" ref="styleSettingRef" />
            </CollapsiblePanel>
            <CollapsiblePanel title="提示词" not-collapsed>
              <PromptSetting
                ref="promptSettingRef"
                hidden-negative-prompt
                hidden-image-to-prompt
                hidden-random-prompt
              />
            </CollapsiblePanel>

          </template>

          <!--   局部重绘     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.LOCAL_REDRAW">
            <ReDrawStyle ref="reDrawStyleRef" />
            <CollapsiblePanel title="提示词" not-collapsed>
              <PromptSetting
                ref="promptSettingRef"
                hidden-negative-prompt
                hidden-image-to-prompt
                hidden-random-prompt
              />
            </CollapsiblePanel>
          </template>

          <!--   智能清除     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.INTELLIGENT_CLEAR">
          </template>

          <!--   高清放大     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.HIGH_DEF_ENLARGE">
            <ResolutionSetting ref="resolutionSettingRef" :original-image-url="uploadImageInfoData?.url" />
            <ScaleType ref="scaleTypeRef"/>
          </template>

          <!--   一键抠图     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.ONE_KEY_CUTOUT">
            <CollapsiblePanel title="提示词" not-collapsed>
              <PromptSetting
                ref="promptSettingRef"
                hidden-negative-prompt
                hidden-image-to-prompt
                hidden-random-prompt
                positive-title="物品提示词"
                :positive-placeholder="currentFunctionGroupMode === EFunctionGroupMode.ONE_KEY_CUTOUT ? '输入您想扣出的物体，比如“沙发”' : ''"
              />
            </CollapsiblePanel>
          </template>

          <!--   万物迁移     -->
          <template v-if="currentFunctionGroupMode === EFunctionGroupMode.ALL_THINGS_TRANSFER">
            <UploadBaseImages
              ref="uploadItemImagesRef"
              title="上传物品图"
              :is-goods="true"
              hide-compress-tip
            />
          </template>
        </div>


        <div class="bottom-block">
          <OutputSetting
            :disabled-count="true"
            :disabled-size="true"
            ref="outputSettingRef"
            @generate="createChangeImageTask"
            :need-clear="!!generatedImages.length"
            @clear="handleClear"
          />
        </div>
      </div>
      <div class="right-panel">
        <ImageStage
          ref="imageStageRef"
          :type="currentFunctionGroupMode"
          :images="generatedImages"
          :initial-index="selectedImageIndex"
          :is-loading="changeImageTaskStatusInfo.generating"
          :under-image-url="generatedUnderImages"
          :preview-url="
            MASK_LAYER_DRAW_CAN_USE_TYPE.includes(currentFunctionGroupMode)
              ? uploadImageInfoData.url
              : ''
          "
          @sendChangeImage="handleRegenerateChangeImage"
        />
        <GenerationLoading
          v-show="changeImageTaskStatusInfo.generating"
          :current-generation-id="changeImageTaskStatusInfo.taskId"
          :gen-progress="changeImageTaskStatusInfo.progress"
          @cancel="cancelCurrentGenerateTask"
        />
        <MaskLayerDraw
          :width="uploadImageInfoData.imageOriginWidth"
          :height="uploadImageInfoData.imageOriginHeight"
          :img-url="uploadImageInfoData.url"
          ref="maskLayerDrawRef"
          v-if="MASK_LAYER_DRAW_CAN_USE_TYPE.includes(currentFunctionGroupMode)
           && uploadImageInfoData.width && uploadImageInfoData.height && !generatedImages.length"
        />
      </div>
      <GenerationHistory ref="historyRef" @regenerate="handleRegenerateDrawImage" @sendChangeImage="handleRegenerateChangeImage" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { cloneDeep } from '@/util/cloneDeep';
import Taro from '@tarojs/taro';

import { createImagesEditedTask, type ICreateImagesEditedTaskParams, } from '@/api/images/createImagesEditedTask.ts';
import type { SSEReader } from '@/lib/request/sse.ts';
import { cancelChangeImageGenerateTask } from '@/api/images/cancelChangeImageGenerateTask';

import {  type IReGenerationInfo } from '@/pages/app/const';
import AppLayout from '@/layouts/AppLayout.vue';
import PromptSetting from '@/pages/app/components/PromptSetting/index.vue';
import OutputSetting from '@/pages/app/components/OutputSetting/index.vue';
import ImageStage from '@/pages/app/components/ImageStage/index.vue';
import { type ImageItem } from '@/pages/app/components/ImageStage/const';
import GenerationHistory from '@/pages/app/components/GenerationHistory/index.vue';
import type { IEmitGenerationParams } from '@/pages/app/components/OutputSetting/const.ts';
import type { IGenerateTaskData } from '@/api/images/createImagesEditedTaskStream.ts';
import CollapsiblePanel from '@/components/CollapsiblePanel/index.vue';

import StyleSetting from './components/StyleSetting/index.vue';
import UploadBaseImages from './components/UploadBaseImages/index.vue';
import ChoseScene from './components/ChoseScene/index.vue';
import ReDrawStyle from './components/ReDrawStyle/index.vue';
import ResolutionSetting from './components/ResolutionSetting/index.vue';
import ScaleType from './components/ScaleType/index.vue';
import GenerationLoading from './components/GenerationLoading/index.vue';
import FunctionGroup from './components/FunctionGroup/index.vue';
import { EFunctionGroupMode, type IFunctionGroupExpose } from './components/FunctionGroup/const';
import MaskLayerDraw from './components/MaskLayerDraw/index.vue';
import type { IMaskLayerDrawExposed } from './components/MaskLayerDraw/const.ts';
import type { IResolutionSettingExpose } from './components/ResolutionSetting/const.ts';
import type { ISceneExpose } from './components/ChoseScene/const.ts'
import type { IScaleTypeExpose } from './components/ScaleType/const.ts';
import {
  DEFAULT_UPLOAD_IMAGE_INFO,
  type IUploadBaseImagesExpose,
  type IUploadImageInfo
} from './components/UploadBaseImages/const'
import type { IReDrawStyleExposed } from './components/ReDrawStyle/const.ts';
import { makeUrlAbsolute } from '@/util/url';

import {
  DEFAULT_CHANGE_IMAGE_TASK_STATUS_INFO,
  EReDrawStyle,
  getPageInitParams, handleGenerationInfoByChangeImageTask,
  type IChangeImageGenerationInfo,
  type IChangeImageTaskStatusInfo,
  MASK_LAYER_DRAW_CAN_USE_TYPE,
  startChangeImageGeneration
} from './const';
import type { IStyleSettingExpose } from './components/StyleSetting/const.ts';


const generatedImages = ref<ImageItem[]>([]);
const generatedUnderImages = ref('');
const currentFunctionGroupMode = ref<EFunctionGroupMode>(EFunctionGroupMode.ONE_KEY_RENDER);


// 组件引用
const promptSettingRef = ref(); // 提示词设置
const styleSettingRef = ref<IStyleSettingExpose>(); // 风格设置
const historyRef = ref(); // 历史记录
const outputSettingRef = ref(); // 输出设置
const imageStageRef = ref(); // 图片展示
const functionGroupRef = ref<IFunctionGroupExpose>(); // 功能分组
const uploadBaseImagesRef = ref<IUploadBaseImagesExpose>(); // 上传图片
const uploadItemImagesRef = ref<IUploadBaseImagesExpose>(); // 上传物品图片
const maskLayerDrawRef = ref<IMaskLayerDrawExposed>(); // 蒙层绘制
const reDrawStyleRef = ref<IReDrawStyleExposed>(); // 重绘场景风格设置
const resolutionSettingRef = ref<IResolutionSettingExpose>(); // 分辨率设置
const choseSceneRef = ref<ISceneExpose>()
const scaleTypeRef = ref<IScaleTypeExpose>()

// 相关参数
const uploadImageInfoData = ref<IUploadImageInfo>(DEFAULT_UPLOAD_IMAGE_INFO);
const selectedSceneId = ref<number>();

// 生成状态管理
const changeImageTaskStatusInfo = ref<IChangeImageTaskStatusInfo>(
  cloneDeep(DEFAULT_CHANGE_IMAGE_TASK_STATUS_INFO),
);

const selectedImageIndex = ref<number>(0); // 当前选中的图片索引
let currentStream: Error | SSEReader<IGenerateTaskData>; // 当前正在生成的任务ID

// 重置生成状态
const resetGeneratingState = () => {
  changeImageTaskStatusInfo.value = cloneDeep(DEFAULT_CHANGE_IMAGE_TASK_STATUS_INFO);
  outputSettingRef.value?.resetGeneratingState();
};

const handleClear = () => {
  Taro.showToast({
    title: '已为您清除当前图片~',
    icon: 'success',
    duration: 2000
  });
  generatedImages.value = [];
  resetGeneratingState();
}

// 创建改图任务
const createChangeImageTask = async (outputConfig: IEmitGenerationParams) => {
  if (!uploadBaseImagesRef.value) return;
  let checkResult = true;
  // 校验上传图片
  checkResult = checkResult && uploadBaseImagesRef.value.validateImage();
  const needCheckMask = MASK_LAYER_DRAW_CAN_USE_TYPE.includes(currentFunctionGroupMode.value);
  if (needCheckMask) {
    if (!maskLayerDrawRef.value){
      checkResult = false;
    }else {
      checkResult = checkResult && maskLayerDrawRef.value.validateHistory();
      if (checkResult) {
        const maskUploadRes = await maskLayerDrawRef.value.uploadCanvasAsImage();
        if (!maskUploadRes) {
          checkResult = false;
        }
      }
    }
  }
  choseSceneRef.value && (checkResult = checkResult && choseSceneRef.value.validate());
  styleSettingRef.value && (checkResult = checkResult && styleSettingRef.value.validate());
  uploadItemImagesRef.value && (checkResult = checkResult && uploadItemImagesRef.value.validateImage());
  promptSettingRef.value && (checkResult = checkResult && (await promptSettingRef.value.validate()));
  if (!checkResult) {
    resetGeneratingState();
    return;
  }

  const uploadImageInfo = uploadBaseImagesRef.value.getCurrentImage();
  const hasOriginTask = Boolean(uploadImageInfo.originTaskId);
  const maskImageId = needCheckMask ? maskLayerDrawRef.value?.getMaskImageInfo()?.id : undefined;

  // 风格模型参数
  let styleExtractionLevelOutward, styleModelId;
  const isReDraw = currentFunctionGroupMode.value === EFunctionGroupMode.LOCAL_REDRAW;
  if (isReDraw) {
    const reDrawStyleInfo = reDrawStyleRef.value?.getReDrawStyleInfo();
    if (reDrawStyleInfo?.reDrawStyle === EReDrawStyle.CUSTOM) {
      styleExtractionLevelOutward = reDrawStyleInfo.styleExtractionLevelOutward || undefined;
      styleModelId = reDrawStyleInfo.styleModelId || undefined;
    }
  } else if (styleSettingRef.value) {
    const info = styleSettingRef.value.getStyleModelSelectedInfo();
    styleExtractionLevelOutward = info.selectedStyleModel ? info.referenceStrength || 0 : undefined;
    styleModelId = info.selectedStyleModel || undefined;
  }

  const sceneInfo = choseSceneRef.value?.getSceneValue();
  const scaleTypeInfo = scaleTypeRef.value?.getParams();

  const params: ICreateImagesEditedTaskParams = {
    // 基础图片任务相关
    originalImageGenerationId: hasOriginTask ? Number(uploadImageInfo.originTaskId) : undefined,
    originalImageId: hasOriginTask ? Number(uploadImageInfo.id) : undefined,
    uploadImageId: hasOriginTask ? undefined : Number(uploadImageInfo.id),
    // 蒙层绘制相关
    maskImageId,
    // 场景相关
    scene: sceneInfo?.sceneModelId || undefined,
    concreteSceneId: selectedSceneId.value || undefined,

    // 风格模型相关
    styleExtractionLevelOutward,
    styleModelId,

    // 提示词相关（必填）
    prompt: promptSettingRef.value?.positivePrompt || undefined,
    negativePrompt: promptSettingRef.value?.negativePrompt || undefined,
    promptImageId: promptSettingRef.value?.positivePromptImageId || undefined,
    negativePromptImageId: promptSettingRef.value?.negativePromptImageId || undefined,

    // 高清放大参数
    enlargedType:  scaleTypeInfo?.scaleType || undefined,
    enlargedParamOutward: scaleTypeInfo?.detailLevel || undefined,

    // 输出设置（必填）
    ratio: outputConfig.ratio,
    width: outputConfig.width,
    height: outputConfig.height,
    count: outputConfig.count,
    // 放大相关
    magnificationOutward: resolutionSettingRef.value?.getSelectedScale() || undefined,
    // 万物迁移物品图ID
    materialImageId: uploadItemImagesRef.value?.getCurrentImage()?.id || undefined,
    // 当前改图任务类型
    type: currentFunctionGroupMode.value,
  };
  console.log('params', params);
  changeImageTaskStatusInfo.value.generating = true;
  const response = await createImagesEditedTask(params);
  if (response instanceof Error || response.code !== 200) {
    console.error(response.message);
    resetGeneratingState();
    return;
  }
  const taskId = response.data.id.toString();
  startChangeImageGeneration(taskId, changeImageTaskStatusInfo, {
    onSuccess: (taskData) => {
      if (taskData.images && taskData.images.length > 0) {
        const validImages = taskData.images.filter((img) => img.imageUrl);
        if (validImages.length > 0) {
          generatedUnderImages.value = makeUrlAbsolute(taskData.underImageUrl || uploadImageInfo.url || '');
          generatedImages.value = validImages.map((img) => ({
            id: img.id.toString(),
            url: makeUrlAbsolute(img.imageUrl),
            thumbnail: makeUrlAbsolute(img.thumbnailUrl),
            fileResourceId: img.fileResourceId,
            alt: `生成图片_${img.id}`,
            isFavorited: false,
            metadata: {
              width: img.width,
              height: img.height,
              originType: taskData.type,
              name: `生成图片_${img.id}`,
              createdAt: img.createdTime,
              prompt: taskData.prompt || '',
            },
            changeImageGenerationInfo: taskData.images.map((item,index) => (handleGenerationInfoByChangeImageTask(taskData, index))),
          }));

          // 计算总耗时
          const totalTime = Date.now() - changeImageTaskStatusInfo.value.generationStartTime;
          console.log(
            `✅ 图片生成完成！总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`,
          );

          // 刷新历史记录
          refreshHistoryAfterGeneration();

          // 显示成功提示
          Taro.showToast({
            title: `已生成 ${validImages.length} 张图片 (耗时${(totalTime / 1000).toFixed(1)}s)`,
            icon: 'success',
            duration: 2000
          });
        }
      }
    },
    resetGeneratingState,
    onCreateGenerateTaskStream: innerCurrentStream => {
      currentStream = innerCurrentStream;
    }
  });
};

const handleRegenerateDrawImage = (info: IReGenerationInfo) => {
  router.push({
    path: '/app',
    query: {
      initData: JSON.stringify(info),
    }
  })
}

// 处理重新生成
const handleRegenerateChangeImage = (info: IChangeImageGenerationInfo) => {
  console.log('info',info);
  functionGroupRef.value?.setCurrentMode(info.type);
  nextTick(()=>{
    const uploadImageInfo:IUploadImageInfo = {
      url: info.uploadImageUrl || '',
      id: info.uploadImageId?.toString() || '',
      width: info.width || 0,
      height: info.height || 0,
      originTaskId: info.originTaskId?.toString() || '',
      imageOriginWidth: 0,
      imageOriginHeight: 0,
    };
    uploadBaseImagesRef.value?.updateImage(uploadImageInfo)
    // 来源为绘图任务
    if (info.concreteSceneId){
      choseSceneRef.value?.updateSceneValue('WHITE_MODEL',info.concreteSceneId?.toString());
      styleSettingRef.value?.updateStyleModelSelectedInfo(info.styleModelId, info.referenceScale, true);
    }
    promptSettingRef.value?.updatePrompt(info.prompt, true);
    promptSettingRef.value?.updatePrompt(info.negativePrompt, false);
    outputSettingRef.value?.updateImageSize({
      width: info.width,
      height: info.height,
      // count: info.num,
      count: 1,
    });
    resolutionSettingRef.value?.updateScale(info.scale);
    generatedImages.value = [];
    selectedImageIndex.value = 0;
  })

};

// 取消当前生成任务
const cancelCurrentGenerateTask = async () => {
  if (!changeImageTaskStatusInfo.value.taskId) {
    Taro.showToast({
      title: '啊哦~当前任务还在路上~稍后再来取消吧~',
      icon: 'error',
      duration: 2000
    });
    return;
  }
  const response = await cancelChangeImageGenerateTask(changeImageTaskStatusInfo.value.taskId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((response as any).code !== 200) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Taro.showToast({
      title: (response as any).response.data.message,
      icon: 'error',
      duration: 2000
    });
    return;
  }
  if (currentStream && !(currentStream instanceof Error)) {
    currentStream.stop();
  }
  Taro.showToast({
    title: '任务已取消',
    icon: 'success',
    duration: 2000
  });
  resetGeneratingState();
};

const onChangeCurrentMode = (mode: EFunctionGroupMode) => {
  if (generatedImages.value.length > 0) {
    generatedImages.value = [];
    selectedImageIndex.value = 0;
  }
  if (currentFunctionGroupMode.value !== mode) {
    maskLayerDrawRef.value?.reloadComponent();
  }
  currentFunctionGroupMode.value = mode;
}

const onUploadImageChange = (val:IUploadImageInfo)=>{
  uploadImageInfoData.value = val;
  generatedImages.value = [];
  selectedImageIndex.value = 0;
  outputSettingRef.value?.updateImageSize({
    width: val.width,
    height: val.height,
    count: 1,
  });
}

// 在生成完成后刷新历史记录
const refreshHistoryAfterGeneration = () => {
  if (historyRef.value && historyRef.value.refreshHistory) {
    setTimeout(() => {
      historyRef.value.refreshHistory();
    }, 1000); // 延迟1秒刷新，确保后端数据已更新
  }
};

onMounted(() => {
  const info = getPageInitParams();
  if (info) handleRegenerateChangeImage(info);
});
</script>

<style lang="less" scoped>
@import './index.less';
/* 组件特定样式 */
</style>
