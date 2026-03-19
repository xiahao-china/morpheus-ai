<template>
  <Layouts>
    <view :class="styles.container">
      <!-- Header Banner -->
      <view :class="styles.banner">
        <view :class="styles.bannerContent">
          <view :class="styles.title">AI 深度风水解析</view>
          <view :class="styles.subtitle">融合传统智慧与现代AI技术</view>
        </view>
      </view>

      <!-- Mode Switcher -->
      <view :class="styles.modeSwitcher">
        <view :class="[styles.modeBtn, styles.active]">检测分析</view>
        <view :class="styles.modeBtn">AI风水顾问</view>
      </view>

      <!-- Upload Section -->
      <view :class="styles.uploadSection">
        <view :class="styles.uploadCard" @tap="handleUpload">
          <template v-if="imageUrl">
            <image :src="imageUrl" mode="aspectFill" :class="styles.uploadedImage" />
          </template>
          <template v-else>
            <view :class="styles.uploadIconWrapper">
              <IconFont font-class-name="iconfont" class-prefix="icon" name="camera" :class="styles.uploadIcon" />
            </view>
            <view :class="styles.uploadTitle">上传 房间/户型图 照片</view>
            <view :class="styles.uploadDesc">AI将自动识别布局与方位</view>
          </template>
        </view>
      </view>

      <!-- Bottom Actions -->
      <view :class="styles.actionGroup">
        <view :class="styles.historyBtn">查看记录</view>
        <view :class="[styles.startBtn, imageUrl ? styles.active : '']" @tap="handleStart">
          {{ loading ? '创建中...' : '立即开始 (4积分)' }}
        </view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Taro from '@tarojs/taro';
import Layouts from '@/components/Layouts/index.vue';
import { IconFont } from '@nutui/icons-vue-taro';
import { createFengshuiTask } from '@/api/fengshui';
import { uploadImageByTaroUrl } from '@/api/files/uploadFileByTaroUrl';
import type { UploadImageResponse } from '@/api/files/uploadFile';
import styles from './index.module.less';

const imageUrl = ref('');
const loading = ref(false);

const uploadFengshuiImage = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    uploadImageByTaroUrl({
      filePath,
      fileType: 'UNDER_IMAGE',
      onSuccess: (resp) => {
        const data = resp.data as UploadImageResponse | undefined;
        const url = data?.fileUrl || data?.url;
        if (!url) {
          reject(new Error('上传结果缺少图片地址'));
          return;
        }
        resolve(url);
      },
      onFail: (err) => {
        reject(err);
      }
    });
  });
};

const handleUpload = async () => {
  try {
    const res = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
    });

    if (res.tempFiles && res.tempFiles.length > 0) {
      imageUrl.value = res.tempFiles[0].tempFilePath;
    }
  } catch (err) {
    console.log('Upload cancelled or failed:', err);
  }
};

const handleStart = async () => {
  if (!imageUrl.value) return;

  loading.value = true;
  try {
    const uploadedImageUrl = await uploadFengshuiImage(imageUrl.value);
    const { taskId } = await createFengshuiTask({ imageUrl: uploadedImageUrl });

    Taro.navigateTo({
      url: `/pages/Fengshui/Progress/index?taskId=${taskId}`
    });
  } catch (err) {
    Taro.showToast({ title: '创建任务失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const env = Taro.getEnv();
  if (env != Taro.ENV_TYPE.WEB) {
    Taro.setTopBarText({
      text: 'AI风水'
    });
  }
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>
