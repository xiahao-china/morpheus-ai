<template>
  <view :class="useRelative ? 'relative-styles' : 'absolute-styles space-x-2'" class="flex">
    <nut-popover v-if="props.useRegenerate" content="重新生成" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handleRegenerate"
          class="action-button"
        >
          <Refresh />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover v-if="props.useSendToChangeImage" content="发送到改图" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handleSendChangeImage"
          class="action-button"
        >
          <ArrowRight />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover v-if="props.useLike" content="满意" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handelFeedback(true)"
          class="action-button"
          :class="feedbackStatus === true ? 'feedback-active' : ''"
        >
          <Star class="feedback-active-icon" />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover v-if="props.useUnlike" content="不满意" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handelFeedback(false)"
          class="action-button"
          :class="feedbackStatus === false ? 'feedback-active2' : ''"
        >
          <Close />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover v-if="props.useCollection" content="收藏" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handleCollection"
          class="action-button"
          :class="collectionStatus === true ? 'collection-active' : ''"
        >
          <Heart :style="{ fill: collectionStatus === true ? 'rgb(255, 82, 102)' : '' }" />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover content="对比" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handleCompare"
          class="action-button"
          :class="showContrast ? 'contrast-active' : ''"
        >
          <Refresh />
        </nut-button>
      </template>
    </nut-popover>

    <nut-popover content="下载" location="top">
      <template #reference>
        <nut-button
          shape="round"
          size="small"
          @click="handleDownload"
          class="action-button"
        >
          <Download />
        </nut-button>
      </template>
    </nut-popover>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Taro from '@tarojs/taro'
import {
  Refresh,
  Download,
  Heart,
  ArrowRight,
  Star,
  Close
} from '@nutui/icons-vue-taro'
import { IImageStageActionButtonsProps } from './const'
import { downloadImage } from '@/utils/util'

defineOptions({
  name: 'ImageStageActionButtons',
});

const props = withDefaults(defineProps<IImageStageActionButtonsProps>(), {
  underImageUrl: '',
  useRelative: false,
  useSendToChangeImage: false,
  useRegenerate: true,
  useLike: true,
  useUnlike: true,
  useCollection: true,
});

const emit = defineEmits<{
  regenerate: [];
  collect: [boolean];
  compare: [showContrast: boolean];
  download: [];
  sendChangeImage: [];
}>();

// 反馈状态 null 未反馈 1 满意 0 不满意
const feedbackStatus = ref<null | boolean>(null);
const collectionStatus = ref<null | boolean>(props.currentImage?.isCollected ?? false);
// 对比状态
const showContrast = ref(false);

const initFeedback = async () => {
  if (!props.currentImage) return;
  // 这里需要根据实际的API调用来实现
  // 暂时使用props中的数据初始化状态
  collectionStatus.value = props.currentImage?.isCollected ?? false;
  feedbackStatus.value = null; // 默认未反馈状态
};

const handelFeedback = async (satisfied: boolean) => {
  if (props.currentImage && props.currentImage.id) {
    try {
      // 这里需要根据实际的API调用来实现
      // 暂时注释掉API调用，使用模拟逻辑
      if (feedbackStatus.value === null) {
        Taro.showToast({
          title: '感谢您的反馈~',
          icon: 'success'
        });
      }
      feedbackStatus.value = satisfied;
    } catch (error) {
      Taro.showToast({
        title: '反馈失败，请稍后重试~',
        icon: 'error'
      });
    }
  }
};

const handleCollection = async () => {
  if (!props.currentImage) return;
  try {
    // 这里需要根据实际的API调用来实现
    // 暂时注释掉API调用，使用模拟逻辑
    const newStatus = !collectionStatus.value;
    collectionStatus.value = newStatus;

    if (newStatus) {
      Taro.showToast({
        title: '收藏成功~',
        icon: 'success'
      });
    } else {
      Taro.showToast({
        title: '取消收藏',
        icon: 'success'
      });
    }

    emit('collect', newStatus);
  } catch (error) {
    Taro.showToast({
      title: '收藏失败，请稍后重试~',
      icon: 'error'
    });
  }
};

const handleCompare = () => {
  if (!props.underImageUrl) {
    Taro.showToast({
      title: '该生成图片没有底图，无法对比哦~',
      icon: 'none'
    });
    return;
  }
  showContrast.value = !showContrast.value;
  emit('compare', showContrast.value);
};

const handleDownload = async () => {
  try {
    if (!props.currentImage || !props.currentImage.url) {
      Taro.showToast({
        title: '没有可下载的图片',
        icon: 'error'
      });
      return;
    }

    const url = props.currentImage.url;
    
    // 获取文件扩展名，默认为 .jpg
    let extension = '.jpg';
    if (url.includes('.png')) extension = '.png';
    else if (url.includes('.gif')) extension = '.gif';
    else if (url.includes('.webp')) extension = '.webp';

    // 指定明确的后缀名，避免小程序 saveImageToPhotosAlbum 报错 fail invalid
    const filePath = `${Taro.env.USER_DATA_PATH}/download_${Date.now()}${extension}`;

    // 使用Taro的下载方式
    await Taro.downloadFile({
      url: url,
      filePath: filePath,
      success: (res) => {
        if (res.statusCode === 200) {
          Taro.saveImageToPhotosAlbum({
            filePath: res.filePath || res.tempFilePath,
            success: () => {
              Taro.showToast({
                title: '保存成功',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('保存相册失败:', err);
              Taro.showToast({
                title: '保存失败',
                icon: 'error'
              });
            }
          });
        }
      },
      fail: (err) => {
        console.error('下载失败:', err);
        Taro.showToast({
          title: '下载失败',
          icon: 'error'
        });
      }
    });

    emit('download');
  } catch (error) {
    console.error('下载失败:', error);
    Taro.showToast({
      title: '下载失败，请重试',
      icon: 'error'
    });
  }
};

const handleRegenerate = () => {
  emit('regenerate');
};

const handleSendChangeImage = () => {
  emit('sendChangeImage');
};

watch(
  () => props.currentImage,
  () => {
    initFeedback();
    showContrast.value = false;
    collectionStatus.value = props.currentImage?.isCollected ?? false;
  },
  {
    immediate: true,
  },
);
</script>

<style lang="less" scoped>
@import './index.less';
</style>
