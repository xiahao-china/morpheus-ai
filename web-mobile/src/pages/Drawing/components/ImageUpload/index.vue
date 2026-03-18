<template>
  <view :class="pageStyle['image-upload-container']">
    <view :class="pageStyle['upload-area']" @click="chooseImage('album')">
      <view v-if="!uploadedUrl && !uploading" :class="pageStyle['upload-chose']">
        <view :class="pageStyle['upload-info']">
          <IconFont :class="pageStyle['upload-icon']" font-class-name="iconfont" class-prefix="icon" name="image_shadow" />
          <view :class="pageStyle['upload-text']">上传线稿/照片/白膜参考图</view>
<!--          <view :class="pageStyle['ai-tip']">内容由AI生成，仅供参考</view>-->
        </view>
        <view :class="pageStyle['actions']">
          <nut-button
            :class="[pageStyle['action-button'], pageStyle['action-button-photo']]"
            size="small"
            @click.stop="chooseImage('album')"
          >
            <view :class="pageStyle['btn-inner']">
              <IconFont :class="pageStyle['btn-icon']" font-class-name="iconfont" class-prefix="icon" name="zhaopian" />
              照片
            </view>
          </nut-button>
          <nut-button
            :class="[pageStyle['action-button'], pageStyle['action-button-camera']]"
            size="small"
            @click.stop="chooseImage('camera')"
          >
            <view :class="pageStyle['btn-inner']">
              <IconFont :class="pageStyle['btn-icon']" font-class-name="iconfont" class-prefix="icon" name="camera" />
              相机
            </view>
          </nut-button>
        </view>
      </view>

      <view v-if="uploading" :class="pageStyle['progress-shell']">
        <IconFont :class="pageStyle['upload-icon']" font-class-name="iconfont" class-prefix="icon" name="image_shadow" />
        <view :class="pageStyle['progress-track']">
          <view :class="pageStyle['progress-bar']" :style="{ width: progress + '%' }"></view>
        </view>
        <text :class="pageStyle['progress-text']">正在上传 {{ progress }}%</text>
      </view>

      <view v-if="uploadedUrl && !uploading" :class="pageStyle['preview-shell']">
        <image :src="uploadedUrl" :class="pageStyle['preview-image']" mode="aspectFit" />
        <Close :class="pageStyle['preview-close']" @click.stop="reset" />
      </view>

    </view>

    <view :class="pageStyle['preview-bg-container']">
      <image :src="DEFAULT_UPLOAD_BG_IMAGE" :class="pageStyle['preview-bg']" mode="aspectFill" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineExpose } from 'vue';
import Taro from '@tarojs/taro';
import pageStyle from './index.module.less';
import {IconFont} from "@nutui/icons-vue-taro";
import { Close } from '@nutui/icons-vue-taro';
import { uploadImageByTaroUrl } from '@/api/files/uploadFileByTaroUrl';
import type { IUploadProgress } from '@/api/files/uploadFile';
import {DEFAULT_UPLOAD_BG_IMAGE, calcScaledSizeByWH} from "@/pages/Drawing/components/ImageUpload/const";

const previewImage = ref('');
const uploadedUrl = ref('');
const uploading = ref(false);
const progress = ref(0);

const emit = defineEmits<{ loaded: [string, string, number, number]; clear: [] }>();

const scaledWidth = ref(0);
const scaledHeight = ref(0);
const calcScaledSize = async (src: string) => {
  try {
    const info = await Taro.getImageInfo({ src });
    const { width, height } = calcScaledSizeByWH(info.width, info.height);
    scaledWidth.value = width;
    scaledHeight.value = height;
  } catch (e) {
    try {
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => { (img.onload as any) = resolve; });
      const w = (img as any).naturalWidth || (img as any).width;
      const h = (img as any).naturalHeight || (img as any).height;
      const { width, height } = calcScaledSizeByWH(w, h);
      scaledWidth.value = width;
      scaledHeight.value = height;
    } catch {}
  }
};

const chooseImage = (sourceType) => {
  Taro.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: [sourceType],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths;
      const localUrl = tempFilePaths[0];
      previewImage.value = localUrl;
      await calcScaledSize(localUrl);
      startUpload(localUrl);
    },
  });
};

const startUpload = async (url: string) => {
  uploading.value = true;
  progress.value = 0;
  try {
    const onProgress = (p: IUploadProgress) => {
      progress.value = p.presentage;
    };
    uploadImageByTaroUrl(
      {
        filePath: url,
        fileType: 'UNDER_IMAGE',
        onSuccess: (resp) => {
          const data = resp.data;
          uploadedUrl.value = data.fileUrl || data.url;
          uploading.value = false;
          progress.value = 0;
          emit('loaded', data.fileUrl || data.url, String(data.fileId || data.id), scaledWidth.value, scaledHeight.value);
          Taro.showToast({ title: '上传成功', icon: 'success' });
        },
        onFail: () => {
          Taro.showToast({ title: '上传失败', icon: 'error' });
          uploading.value = false;
          progress.value = 0;
        },
      },
      onProgress,
    );
  } catch (err) {
    console.error(err);
    uploading.value = false;
    progress.value = 0;
    Taro.showToast({ title: '上传失败，请重试', icon: 'error' });
  }
};

const reset = () => {
  previewImage.value = '';
  uploadedUrl.value = '';
  uploading.value = false;
  progress.value = 0;
  emit('clear');
};

defineExpose({ reset });
</script>

<style lang="less" scoped>
</style>
