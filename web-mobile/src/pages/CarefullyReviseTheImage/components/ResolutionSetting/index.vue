<template>
  <div class="resolution-setting">
    <div class="title">分辨率设置</div>
    <div >
      <div class="size-info">
        <label class="size-info-title text-sm text-gray-600">原图:</label>
        <span class="size-info-num">
          <div class="width-num">{{ originalImageSize?.width || '-' }}</div>
          <ElIcon class="link-icon">
            <Link/>
          </ElIcon>
          <div class="height-num">{{ originalImageSize?.height || '-' }}</div>
        </span>
      </div>
      <div class="scale-select">
        <label class="size-info-title text-sm text-gray-600">放大倍率:</label>
        <div class="scale-list">
          <ElTag
            class="scale-item"
            v-for="item in ENLARGE_MODE_RADIO_GROUP"
            :key="item.value"
            type="info"
            :class="{ 'active': selectedScale === item.value }"
            @click="()=>calculateNewSize(item.value)"
          >
            {{item.label}}
          </ElTag>
        </div>
      </div>
      <div class="size-info">
        <label class=" size-info-title text-sm text-gray-600">放大后:</label>
        <span class="size-info-num">
          <div class="width-num">{{ newImageSize?.width || '-' }}</div>
          <el-icon class="link-icon">
            <Link/>
          </el-icon>
          <div class="height-num">{{ newImageSize?.height || '-' }}</div>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type AppContext } from 'vue';
import { ElMessage, ElTag, ElIcon } from 'element-plus';
import { EEnlargeMode, ENLARGE_MODE_RADIO_GROUP, type IResolutionSettingExpose } from './const.ts'
import {Link} from '@/components/Icons'

const props = defineProps<{
  originalImageUrl: string;
}>();

const originalImageSize = ref<{ width: number; height: number } | null>(null);
const selectedScale = ref<EEnlargeMode>(EEnlargeMode.TWO);
const newImageSize = ref<{ width: number; height: number } | null>(null);

const getImageSize = async (url: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
};

const calculateNewSize = (val?: EEnlargeMode) => {
  if (val) selectedScale.value = val;
  if (originalImageSize.value) {
    const scale = parseInt(selectedScale.value.toString());
    newImageSize.value = {
      width: originalImageSize.value.width * scale,
      height: originalImageSize.value.height * scale,
    };
  }
};

const resetInfo = () => {
  originalImageSize.value = null;
  newImageSize.value = null;
}

watch(() => props.originalImageUrl, async (newUrl) => {
  if (!newUrl) {
    resetInfo();
    return;
  }
  try {
    originalImageSize.value = await getImageSize(newUrl);
    calculateNewSize();
  } catch (error) {
    ElMessage.error('获取图片尺寸失败',error as AppContext);
  }
}, {immediate: true});

const getSelectedScale = () => {
  return selectedScale.value;
}

const updateScale = async (scale?: EEnlargeMode) => {
  if (scale)
    calculateNewSize(scale);
}

defineExpose<IResolutionSettingExpose>({
  getSelectedScale,
  updateScale,
})

</script>

<style lang="less" scoped>
@import "./index.less";
</style>
