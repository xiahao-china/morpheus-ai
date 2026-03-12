<template>
  <view :class="pageStyle['detail-info']">
    <view :class="pageStyle['title-model']">{{detailInfo.model}}</view>
    <view :class="pageStyle['time-info']">{{detailInfo.time}}</view>
    <view :class="[pageStyle['detail-info-content'], images.length > 1 && !props.onlyShowOneImg ? pageStyle['extra-len'] : '']">
      <view :class="pageStyle['detail-item']" v-for="item in detailInfo.listInfo" :key="item.title">
        <view :class="pageStyle['detail-title']">{{ item.title }}</view>
        <view :class="pageStyle['detail-content']">
          <view :class="pageStyle['preview-img-shell']" v-if="item.imgUrl">
            <image :class="pageStyle['preview-img']" lazy-load  :src="item.imgUrl" mode="aspectFit" />
          </view>
          <view v-if="item.text" :class="[pageStyle['detail-text'], item.none ? pageStyle['none'] : '']">
            {{ item.text }}
          </view>
        </view>
      </view>
    </view>
    <view
      v-if="props.publishInfo.showPublishBtn"
      :class="[
        pageStyle['publish-btn'],
        {
          [pageStyle['cancel-publish-btn']]: props.publishInfo.publishStatus === EPublishStatus.published,
          [pageStyle['disabled']]: !props.publishInfo.isFromWorks && props.publishInfo.publishStatus === EPublishStatus.published,
        }
      ]"
      @click="handlePublish"
    >
      {{publishText}}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, watch } from 'vue';
import {
  handleDetailInfo,
   type ITaskDetailInfo,
  PUBLISH_STATUS_INFO_MAP,
  EPublishStatus, type IHistoryDetailInfoProps
} from './const';
import pageStyle from './index.module.less';

const emit = defineEmits<{
  publish: [],
  cancelPublish: [],
}>()

const props = withDefaults(defineProps<IHistoryDetailInfoProps>(), {});

const detailInfo = ref<ITaskDetailInfo>(handleDetailInfo(props.taskInfo))

const publishText = computed(() => {
  if (props.publishInfo.publishStatus === EPublishStatus.published && !props.publishInfo.isFromWorks) {
    return '已发布'
  }
  return PUBLISH_STATUS_INFO_MAP[props.publishInfo.publishStatus].optionLabel
})


const images = computed(() => {
  return props.taskInfo?.images || []
})

const handlePublish = () => {
  if (props.publishInfo.publishStatus === EPublishStatus.published) {
    (props.publishInfo.isFromWorks) && emit('cancelPublish');
    return;
  }
  emit('publish')
}

watch(() => props.taskInfo, (newVal) => {
  detailInfo.value = handleDetailInfo(newVal)
})

</script>

<style lang="less" scoped>
</style>
