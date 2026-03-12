<template>
  <div class="upload-base-images-shell">
    <div class="top-block">
      <div class="title">{{title}}</div>
      <div class="su-plugin-upload-btn" v-if="canUseSuPlugin" @click="handleSuPluginClick">
        {{isUsingSuPlugin ? '模型截图中' : '使用模型截图'}}
        <ElIcon :class="isUsingSuPlugin ? 'loading-icon animate-spin' : ''">
          <component :is="isUsingSuPlugin ? Loading : ChevronRight" />
        </ElIcon>
      </div>
    </div>
    <div class="upload-base-images">
      <div
        v-if="!uploadedImage"
        class="upload-area"
        :class="{ 'border-error': isError }"
        v-loading="uploadLoading"
        @click="handleClick"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <Upload class="upload-icon" />
        <p class="upload-text">点击或拖拽图片上传</p>
        <ChoseHistoryImage @chose="updateImage" :is-goods="props.isGoods"/>
        <p class="upload-tip">支持 {{props.isGoods ? 'PNG' : 'JPG、JPEG、PNG'}} 格式，最大 10MB</p>
        <div class="uploading-block" v-if="uploadLoading">
          <!-- 显示进度条 -->
          <ElProgress
            class="upload-progress"
            :stroke-width="16"
            :percentage="uploadProgress"
            text-inside
          />
          <div class="uploading-tip">文件上传中，请稍后~</div>
        </div>
      </div>
      <div v-else class="image-container">
        <ElImage
          :src="uploadedImage"
          alt="上传的图片"
          class="uploaded-image"
          fit="cover"
          preview-teleported
          :preview-src-list="[uploadedImage]"
        />
        <button @click="handleRemoveImage" class="remove-button" title="移除图片">×</button>
        <ElTag class="compressed-tag" type="info" size="small" v-if="compressedTag">已压缩</ElTag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage, ElImage, ElTag, ElProgress, ElIcon } from 'element-plus';
import { Upload, ChevronRight, Loading } from '@/components/Icons';
import { type IUploadProgress, uploadImage, type UploadImageParams } from '@/api/files/uploadFile.ts';
import { calcImageLimit, ECalcImageLimitRes, imageLimitTipByRes } from '@/pages/app/const.ts';
import { compressImage, loadImageOriginSize } from '@/constants/util.ts';

import ChoseHistoryImage from '../ChoseHistoryImage/index.vue';

import {
  getImageUrlToFile,
  type IUploadBaseImagesExpose,
  type IUploadImageInfo,
  type IUploadImageProps,
  MAX_IMAGE_SIZE, MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE, turnBase64ToImageFile
} from './const.ts';
import { getModelScreenshot } from '@/lib/sketchUpPlugin/modelScreenshot';
import sketchupPluginObj from '@/lib/sketchUpPlugin';

let originTaskId = '';

const uploadedImage = ref('');
const imageName = ref('');
const isError = ref(false);
const uploadLoading = ref(false);
const uploadedImageId = ref<string>('');
const imageWidth = ref<number>(0);
const imageHeight = ref<number>(0);
let imageOriginWidth = 0;
let imageOriginHeight = 0;

// 能否使用插件模型截图
const canUseSuPlugin = ref(sketchupPluginObj.checkSuccess);

// 已压缩tag
const compressedTag = ref<boolean>(false);

// 定义上传进度
const uploadProgress = ref(0);

const props = withDefaults(defineProps<IUploadImageProps>(), {
  hideCompressTip: false,
  title: '上传图片',
});

const emit = defineEmits<{
  change: [info: IUploadImageInfo];
}>();

// 是否正在使用插件模型截图
const isUsingSuPlugin = ref(false);
const handleSuPluginClick = async () => {
  if (uploadLoading.value || isUsingSuPlugin.value) return;
  isUsingSuPlugin.value = true;
  const imgFileInfo = await getModelScreenshot();
  isUsingSuPlugin.value = false;
  if (!imgFileInfo.isSuccess || !imgFileInfo.imgBase64) {
    ElMessage.error(imgFileInfo.message);
    console.error(imgFileInfo.message);
    return;
  }
  const file = turnBase64ToImageFile(imgFileInfo.imgBase64);
  console.log('file',file);
  handleFile(file);
}

// 处理点击上传
const handleClick = () => {
  if (uploadLoading.value || isUsingSuPlugin.value) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = props.isGoods ? 'image/png' : 'image/jpeg, image/png, image/jpg';
  input.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files || !files[0]) return;
    handleFile(files[0]);
  };
  input.click();
};


// 处理拖拽上传
const handleDrop = (event: DragEvent) => {
  if (uploadLoading.value || isUsingSuPlugin.value) return;
  const file = event.dataTransfer?.files[0];
  if (file) {
    handleFile(file);
  }
};

// 处理文件
const handleFile = (file: File) => {
  // 检查文件类型
  // 万物迁移的物品上传仅png
  if (props.isGoods){
    if (file.type !== 'image/png') {
      ElMessage.error('只能上传 PNG 格式的图片');
      return;
    }
  }else {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      ElMessage.error('只能上传 JPG、PNG 格式的图片');
      return;
    }
  }

  // 检查文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    ElMessage.error('图片大小不能超过 10MB');
    return;
  }
  uploadLoading.value = true;

  // 创建图片预览
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageUrl = e.target?.result as string;

    // 获取图片实际尺寸
    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve
    });
    let needCompress = false;
    // 超出最大限制则需要压缩
    if (img.naturalHeight> MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE || img.naturalWidth > MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE) {
      needCompress = true;
      ElMessage.warning(`图片长宽尺寸过大将为您压缩至${MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE}*${MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE}`);
    }
    const size = calcImageLimit({
      width: img.naturalWidth,
      height: img.naturalHeight,
      customImageSizeMax: MAX_WIDTH_AND_HEIGHT_IMAGE_SIZE,
    });
    if (
      imageLimitTipByRes[size.resType] &&
      (size.resType !== ECalcImageLimitRes.successAutoScale ||
        (size.resType === ECalcImageLimitRes.successAutoScale && !props.hideCompressTip))
    ) {
      ElMessage.info(imageLimitTipByRes[size.resType]);
    }
    compressedTag.value = size.resType === ECalcImageLimitRes.successAutoScale && !props.hideCompressTip;
    if (!size.success) {
      removeImage();
      uploadLoading.value = false;
      return;
    }

    imageOriginWidth = needCompress ? size.width: img.naturalWidth;
    imageOriginHeight = needCompress ? size.height: img.naturalHeight;
    imageWidth.value = size.width;
    imageHeight.value = size.height;
    if (needCompress){
      const handleImg = await compressImage(file, size.width, size.height);
      handleUpload(handleImg.file, handleImg.src);
      return;
    }
    handleUpload(file, imageUrl);
  };
  reader.readAsDataURL(file);
};

const handleUpload = async (file: File | null, url: string) => {
  const handleFile = file ? file : await getImageUrlToFile(url);
  const config = {
    imageFile: handleFile,
    fileType: props.isGoods ? 'MATERIAL_IMAGE' : 'UNDER_IMAGE',
  } as UploadImageParams;
  // 处理上传进度
  const handleUploadProgress = (uploadInfo: IUploadProgress) => {
    uploadProgress.value = uploadInfo.presentage;
  };
  const res = await uploadImage(config, handleUploadProgress);

  console.log(res);
  // 检查返回的 code 和 msg
  if (res instanceof Error || res.code !== 200) {
    console.error('图片上传失败:', res);
    uploadLoading.value = false;
    uploadProgress.value = 0; // 上传失败，重置进度
    return;
  }
  uploadLoading.value = false;
  uploadProgress.value = 0; // 上传成功，重置进度
  const imageId = Number(res.data.id);
  uploadedImageId.value = imageId.toString();
  uploadedImage.value = url;
  imageName.value = handleFile.name;
  ElMessage.success('图片上传成功');
  isError.value = false; // 上传成功后将错误状态置为 false
  console.log('图片上传成功:', res);
  emit('change', {
    url: uploadedImage.value,
    id: uploadedImageId.value,
    width: imageWidth.value,
    height: imageHeight.value,
    imageOriginWidth,
    imageOriginHeight,
    originTaskId,
  });
};

const onChangeEvent = () => {
  emit('change', {
    url: uploadedImage.value,
    id: uploadedImageId.value,
    width: imageWidth.value,
    height: imageHeight.value,
    imageOriginWidth,
    imageOriginHeight,
    originTaskId,
  });
};

// 处理删除图片
const handleRemoveImage = () => {
  removeImage();
  ElMessage.success('图片已删除');
  onChangeEvent();
};

const removeImage = () => {
  uploadedImage.value = '';
  imageName.value = '';
  uploadedImageId.value = '';
  imageWidth.value = 0;
  imageHeight.value = 0;
  imageOriginWidth = 0;
  imageOriginHeight = 0;
  uploadLoading.value = false;
};

// 校验图片内容
const validateImage = () => {
  if (uploadLoading.value) {
    ElMessage.error('图片上传中，请稍后~');
    return false;
  }
  if (!uploadedImage.value) {
    isError.value = true;
    ElMessage.error('请上传图片');
    return false;
  }
  isError.value = false;
  return true;
};

// 获取当前图片
const getCurrentImage = () => {
  return {
    url: uploadedImage.value,
    id: uploadedImageId.value,
    width: imageWidth.value,
    height: imageHeight.value,
    imageOriginWidth,
    imageOriginHeight,
    originTaskId,
  };
};

const updateImage = async (info: IUploadImageInfo) => {
  uploadedImage.value = info.url;
  imageName.value = info.url.split('/').pop() || '';
  imageWidth.value = info.width;
  imageHeight.value = info.height;
  originTaskId = info.originTaskId || '';
  const size = await loadImageOriginSize(info.url);
  if (size) {
    imageOriginWidth = size.width;
    imageOriginHeight = size.height;
  }
  onChangeEvent();
  if (!info.id) {
    handleUpload(null, info.url);
  }else {
    uploadedImageId.value = info.id;
  }
};

// 暴露方法
defineExpose<IUploadBaseImagesExpose>({
  validateImage,
  getCurrentImage,
  updateImage,
});

// 监听图片变化，自动重置错误状态
watch(uploadedImage, () => {
  if (uploadedImage.value) {
    isError.value = false;
  }
});
</script>

<style lang="less" scoped>
@import './index.less';
</style>
