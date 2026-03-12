<template>
  <nut-popup
        v-model:visible="show"
        position="bottom"
        :style="{ maxHeight: '80vh' }"
        closeable
        @close="handleClose"
        safe-area-inset-bottom
        :class="pageStyle['history-detail-dialog']"
      >
        <scroll-view>
          <view :class="pageStyle['history-detail-container']" v-if="taskInfo">
            <view :class="pageStyle['task-info']">
              <view :class="pageStyle['left-block']">
                <view :class="pageStyle['image-block']">
                  <image
                    v-show="taskInfo"
                    :src="taskInfo.images[currentImgIndex].imageUrl"
                    mode="aspectFit"
                    :class="pageStyle['image-block-inner']"
                  >
                  </image>
                </view>
                <view :class="pageStyle['image-list']" v-show="!isMobile">
                  <view v-if="images.length > 1 && !onlyOneImage" class="flex-shrink-0 bg-white">
                    <view class="flex space-x-2 overflow-x-auto">
                      <view
                        v-for="(image, index) in images"
                        :key="`thumb-${image.id || index}`"
                        :class="[
                    'flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all duration-200 relative cursor-pointer',
                    index === currentImgIndex
                      ? 'border-blue-500 border-2'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                        @click="scrollToIndex(index)"
                      >
                        <image
                          :src="image.imageUrl"
                          mode="aspectFill"
                          class="w-full h-full object-cover"
                        />

                        <!-- 选中指示器 -->
                        <view
                          v-if="index === currentImgIndex"
                          class="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
                        >
                          <view class="w-2 h-2 bg-blue-500 rounded-full"></view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
                <view :class="pageStyle['tool-list']" v-show="!isMobile">
                  <ImageStageActionButtons
                    v-if="currentImage"
                    :current-image="currentImage"
                    :under-image-url="taskInfo?.underImageUrl"
                    :use-send-to-change-image="
                (!taskInfo.type || taskInfo.type === EFunctionGroupMode.DRAWING) && !publishInfo.isFromWorks
              "
                    :use-regenerate="!publishInfo.isFromWorks"
                    :use-like="!publishInfo.isFromWorks"
                    :use-unlike="!publishInfo.isFromWorks"
                    :use-collection="!publishInfo.isFromWorks"
                    :source-type="
                !taskInfo.type || taskInfo.type === EFunctionGroupMode.DRAWING
                  ? ESourceType.GENERATION
                  : ESourceType.EDITED
              "
                    use-relative
                    :work-collection-status="publishInfo.isCollected"
                    @regenerate="handleRegenerate"
                    @compare="handleCompare"
                    @sendChangeImage="handleSendChangeImage"
                    @collect="handleCollect"
                  />
                </view>
              </view>
              <transition name="publish-block" mode="out-in">
                <PublishWork
                  v-if="showPublishBlock"
                  @cancel="showPublishBlock = false"
                  :taskInfo="taskInfo"
                  :current-index="currentImgIndex"
                  @save="handleSave"
                />
                <DetailInfo
                  v-else
                  :publish-info="publishInfo"
                  :taskInfo="taskInfo"
                  :only-show-one-img="onlyOneImage"
                  @publish="showPublishBlock = true"
                  @cancel-publish="handleCancelPublish"
                />
              </transition>
            </view>
            <UserAndWorkInfo
              :class="pageStyle['user-and-work-info']"
              v-if="publishInfo.isFromWorks && userInfo && workInfo"
              :user="userInfo"
              :work="workInfo"
              @collect="handleCollect"
            />
          </view>
        </scroll-view>
      </nut-popup>
</template>

<script setup lang="ts">
import { computed, defineEmits, onMounted, onUnmounted, ref } from 'vue';
import dayjs from 'dayjs';
import { cloneDeep } from '@/util/cloneDeep';
import pageStyle from './index.module.less';

import { getGenerationsDetail, type IGetGenerationHistoryItem } from '@/api/images/getGenerationHistoryDetail';
import {
  getGenerationsChangeImageDetail,
  type IGetChangeGenerationHistoryItem
} from '@/api/images/getGenerationChangeImageHistoryDetail';
import type { ApiResponse } from '@/lib/request/http';
import { ESourceType } from '@/api/images/generateImageFeedback';

import ImageStageActionButtons from '@/components/ImageStageActionButtons/index.vue';
import type { IImageStageActionButtonsProps } from '@/components/ImageStageActionButtons/const';
import type { IImageContrastExpose } from '@/components/ImageContrast/const';
import { handleGenerationInfoByTask, type IReGenerationInfo } from '@/pages/app/const';
import type { ISquareDetailResponse } from '@/api/square/squareDetail';
import {
  handleGenerationInfoByChangeImageTask,
  type IChangeImageGenerationInfo
} from '@/pages/CarefullyReviseTheImage/const';
import {
  CHANGE_IMAGE_MODE_LIST,
  EFunctionGroupMode
} from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const';
import {
  DEFAULT_PUBLISH_INFO,
  EPublishStatus,
  type ISquarePublishInfo
} from '@/components/HistoryDetail/components/DetailInfo/const';
import { isMobileDevice } from '@/constants/util';

import PublishWork from './components/PublishWork/index.vue';
import DetailInfo from './components/DetailInfo/index.vue';
import UserAndWorkInfo from './components/UserAndWorkInfo/index.vue';
import {
  DEFAULT_USER_INFO,
  DEFAULT_WORK_INFO,
  type UserInfo,
  type WorkInfo
} from './components/UserAndWorkInfo/const';

import {
  handleToHistoryTaskInfo,
  type IHistoryDetailExpose,
  type IHistoryDetailInitProps,
  type IHistoryTaskInfo
} from './const';


const show = ref(false);
const showContrast = ref(false);
const onlyOneImage = ref(false);
const currentImgIndex = ref(0);
const taskInfo = ref<IHistoryTaskInfo>();
const userInfo = ref<UserInfo>();
const workInfo = ref<WorkInfo>();

const isMobile = ref(isMobileDevice());

const showPublishBlock = ref(false);
const publishInfo = ref<ISquarePublishInfo>(cloneDeep(DEFAULT_PUBLISH_INFO));

const emit = defineEmits<{
  regenerate: [info: IReGenerationInfo];
  sendChangeImage: [info: IChangeImageGenerationInfo];
  cancelPublish: [string],
  collect: [boolean];
}>();

// 提供给迭代图操作项组件的参数
const currentImage = computed(() => {
  const originItem = taskInfo.value?.images[currentImgIndex.value];
  if (!originItem) {
    return undefined;
  }
  const imgInfo:IImageStageActionButtonsProps['currentImage'] = {
    id: originItem.id,
    url: originItem.imageUrl,
    fileResourceId: originItem.fileResourceId,
    isFavorited: false,
    isCollected: publishInfo.value.isCollected,
    workId: taskInfo.value?.squareId,
  };
  return imgInfo;
});

const images = computed(() => {
  return taskInfo.value?.images || [];
});

// 关闭弹窗的处理函数
const handleClose = () => {
  show.value = false;
  workInfo.value = undefined;
  userInfo.value = undefined;
};

const initTaskInfo = async (taskId: string, type: EFunctionGroupMode, defaultImgId: number) => {
  let response: Error | ApiResponse<IGetGenerationHistoryItem | IGetChangeGenerationHistoryItem>;
  if (CHANGE_IMAGE_MODE_LIST.includes(type)) {
    response = await getGenerationsChangeImageDetail(taskId);
  } else {
    response = await getGenerationsDetail(taskId);
  }
  if (response instanceof Error || response.code !== 200) {
    console.error('获取历史记录失败:', response);
    return;
  }
  const findIndex = response.data.images.findIndex((item) => item.id === defaultImgId);
  if (findIndex !== -1) {
    currentImgIndex.value = findIndex;
  }
  publishInfo.value.publishStatus =
    response.data.images[currentImgIndex.value].isPublishedSquare ? EPublishStatus.published : EPublishStatus.unpublish;
  taskInfo.value = handleToHistoryTaskInfo(response.data, false);
};

const showHistoryDetail = (params: IHistoryDetailInitProps) => {
  show.value = true;
  showContrast.value = false;
  showPublishBlock.value = false;
  if (params.onlyOneImage) {
    onlyOneImage.value = true;
    window.removeEventListener('keydown', handleKeydown);
  }
  publishInfo.value.isFromWorks = false;
  publishInfo.value.showPublishBtn = true;
  initTaskInfo(params.taskId, params.type, params.defaultImgId);
};

const showSquareDetail = (params: ISquareDetailResponse, showPublish: boolean) => {
  show.value = true;
  showContrast.value = false;
  onlyOneImage.value = true;
  showPublishBlock.value = false;
  window.removeEventListener('keydown', handleKeydown);
  currentImgIndex.value = 0;
  console.log('params', params);
  taskInfo.value = handleToHistoryTaskInfo(params, true);
  publishInfo.value.publishStatus = EPublishStatus.published;
  publishInfo.value.isFromWorks = true;
  publishInfo.value.showPublishBtn = showPublish;
  publishInfo.value.isCollected = params.isCollected;

  userInfo.value = {
    nickname: params.username || DEFAULT_USER_INFO.nickname,
    avatar: params.avatar || DEFAULT_USER_INFO.avatar,
  };
  workInfo.value = {
    title: params.title || DEFAULT_WORK_INFO.title,
    description: params.caption || DEFAULT_WORK_INFO.description,
    type: params.styleTags.split(',') || DEFAULT_WORK_INFO.type,
    scene: params.sceneTags.split(',') || DEFAULT_WORK_INFO.scene,
    updateTime: params.updateTime ? dayjs(params.updateTime).format('YYYY-MM-DD HH:mm:ss') : DEFAULT_WORK_INFO.updateTime,
    isCollection: params.isCollected,
    workId: params.id.toString(),
    collections: params.collectCount || DEFAULT_WORK_INFO.collections,
  };
};

const handleCancelPublish = () => {
  emit('cancelPublish', taskInfo.value?.squareId?.toString() || '');
  handleClose();
}

const handleRegenerate = () => {
  if (!taskInfo.value) return;
  if (taskInfo.value.type === EFunctionGroupMode.DRAWING || !taskInfo.value.type) {
    const info: IReGenerationInfo = handleGenerationInfoByTask(taskInfo.value.originTaskInfo);
    if (taskInfo.value?.images[currentImgIndex.value]) {
      emit('regenerate', info);
      show.value = false;
    }
    return;
  }
  handleSendChangeImage();
};

const handleSendChangeImage = () => {
  if (!taskInfo.value) return;
  const info: IChangeImageGenerationInfo = handleGenerationInfoByChangeImageTask(
    taskInfo.value.originTaskInfo,
    currentImgIndex.value,
  );
  if (taskInfo.value?.images[currentImgIndex.value]) {
    emit('sendChangeImage', info);
    show.value = false;
  }
};

const imageContrastRef = ref<IImageContrastExpose>();
const handleCompare = (val: boolean) => {
  if (imageContrastRef.value) {
    imageContrastRef.value.changeShowContrast(val);
  }
};

const scrollToIndex = (index: number) => {
  if (index >= 0 && index < images.value.length) {
    // 切换图片时不需要重置任何加载状态，直接切换即可
    currentImgIndex.value = index;
    if (taskInfo.value) {
      publishInfo.value.publishStatus =
        taskInfo.value.images[index].isPublishedSquare ? EPublishStatus.published : EPublishStatus.unpublish;
    }

  }
};

const scrollToPrev = () => {
  const newIndex = currentImgIndex.value > 0 ? currentImgIndex.value - 1 : images.value.length - 1;
  scrollToIndex(newIndex);
};

const scrollToNext = () => {
  const newIndex = currentImgIndex.value < images.value.length - 1 ? currentImgIndex.value + 1 : 0;
  scrollToIndex(newIndex);
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  const activeElement = document.activeElement;
  if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;
  if (images.value.length <= 1) return;
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      scrollToPrev();
      break;
    case 'ArrowRight':
      event.preventDefault();
      scrollToNext();
      break;
  }
};

const handleSave = () => {
  showPublishBlock.value = false;
  publishInfo.value.publishStatus = EPublishStatus.published;
  if (taskInfo.value)
    taskInfo.value.images[currentImgIndex.value].isPublishedSquare = true;

};

const handleCollect = (val:boolean) => {
  emit('collect', val);
}

// 组件生命周期
onMounted(() => window.addEventListener('keydown', handleKeydown));

onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

onMounted(() => {});

defineExpose<IHistoryDetailExpose>({
  showHistoryDetail,
  showSquareDetail,
});
</script>

<style lang="less">

</style>
