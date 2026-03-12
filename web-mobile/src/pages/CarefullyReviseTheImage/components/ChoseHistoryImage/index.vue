<template>
  <ElPopover
    v-model:visible="showPopup"
    placement="right"
    trigger="click"
    :width="DEFAULT_CONFIG.popupWidth"
    popper-class="history-image-popover"
  >
    <!-- 触发元素 -->
    <template #reference>
      <div class="trigger-text" @click.stop>
        或从
        <span class="trigger-text-history">历史创作</span>
        中选择
      </div>
    </template>

    <!-- 弹出内容 -->
    <div class="popup-content" v-loading="loading">
      <!-- 筛选器 -->
      <div class="filter-container">
        <div class="filter-item">
          <label class="select-filter-label">图片类型：</label>
          <div class="select-filter-content">
            <ElTag
              class="filter-select"
              type="info"
              v-for="option in currentFilterList"
              :key="option.value"
              :class="{active: selectedFilter === option.value, disabled: option.disabled}"
              @click="()=>option.disabled ? void 0 : handleFilterChange(option.value)"
            >
              {{ option.label }}
            </ElTag>
          </div>
        </div>

      </div>

      <!-- 图片列表 -->
      <div class="images-container">
        <ul
          v-infinite-scroll-directive="initHistory"
          class="infinite-list"
          :infinite-scroll-disabled="loadEnd"
        >
          <li
            v-for="item in historyImages"
            :key="item.id"
            class="infinite-list-item"
          >
            <ElImage
              class="record-img"
              show-progress
              fit="cover"
              lazy
              :src="item.url"
              @click="() => handleImageSelect(item)"
            />
          </li>
        </ul>
        <div v-if="!loading && loadEnd && filteredImages.length === 0" class="empty-tip">
          暂无匹配的历史创作图片
        </div>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElImage, ElInfiniteScroll, ElMessage, ElPopover, ElTag } from 'element-plus';

import { EHistoryFilterTime, getRecentGenerationsV2 } from '@/api/images/getGenerationHistoryV2.ts'
import { EFunctionGroupMode } from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const.ts'
import type {
  IUploadImageInfo
} from '@/pages/CarefullyReviseTheImage/components/UploadBaseImages/const.ts'
import { loadImageOriginSize } from '@/constants/util.ts'

import {
  FILTER_OPTIONS,
  DEFAULT_CONFIG,
  type IHistoryImage,
  type IChoseHistoryImageProps, type IFilterOptionsItem,
  mergeHistory, getFilterOptions
} from './const';
import type { IObject } from '@/constants/types.ts'

// 外部传入的props
const props = defineProps<IChoseHistoryImageProps>();

const vInfiniteScrollDirective = ElInfiniteScroll

// 暴露的事件
const emit = defineEmits<{
  chose: [IUploadImageInfo]
}>();

// 内部状态
const showPopup = ref(false);
const selectedFilter = ref<string>(props.isGoods ? EFunctionGroupMode.ONE_KEY_CUTOUT :'');
const historyImages = ref<IHistoryImage[]>([]);
const currentFilterList = ref<IFilterOptionsItem[]>(getFilterOptions(props.isGoods));

// 筛选后的图片列表
const filteredImages = computed(() => {
  if (!selectedFilter.value) return historyImages.value;
  return historyImages.value.filter(
    image => image.functionType === selectedFilter.value
  );
});

// 图片选择处理
const handleImageSelect = async (selectedImage: IHistoryImage) => {
  // 获取图片宽高信息
  loading.value = true;
  const size = await loadImageOriginSize(selectedImage.url);
  const params = {
    ...size,
    ...selectedImage,
    imageOriginWidth:size.width,
    imageOriginHeight:size.height,
  }

  delete (params as IObject).functionType;
  delete (params as IObject).extra;
  loading.value = false;
  emit('chose', params);
  showPopup.value = false;
};

const pageNum = ref(0)
const loading = ref(false)
const loadEnd = ref(false)

const initHistory = async (isRefresh?: boolean) => {
  if (loading.value) return
  if (isRefresh) {
    pageNum.value = 0
    historyImages.value = []
    loadEnd.value = false
  }
  pageNum.value++;
  loading.value = true
  const response = await getRecentGenerationsV2({
    pageNo: pageNum.value,
    pageSize: 20,
    timeRange: EHistoryFilterTime.all,
    type: selectedFilter.value || null,
  })
  if (response instanceof Error || response.code !== 200) {
    console.error('Error fetching history:', response)
    return
  }
  loading.value = false
  if (!response.data.records.length) loadEnd.value = true
  const list = mergeHistory(historyImages.value, response.data.records);
  historyImages.value = list;
}

watch(() => props.disabledFunctionType, (newVal) => {
  if (newVal) {
    currentFilterList.value = FILTER_OPTIONS.filter(item => !newVal.includes(item.value as EFunctionGroupMode));
  }
})

// 筛选条件变化处理
const handleFilterChange = (type: string) => {
  if (type === selectedFilter.value) return;
  selectedFilter.value = type;
  initHistory(true);
};


</script>
<style lang="less" scoped>
@import "./index.less";
</style>
