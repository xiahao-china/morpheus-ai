<template>
  <view :class="styles['detail-info-container']">
    <!-- Generation Info Card -->
    <view :class="styles['card']">
      <view :class="styles['card-header']">
        <IconFont name="star" size="18" color="#7d5fff" />
        <text :class="styles['title']">生成信息</text>
        <view :class="styles['tag']" v-if="taskInfo.type">{{
          getModeName(taskInfo.type)
        }}</view>
      </view>

      <view :class="styles['content']">
        <view :class="styles['prompt-section']" v-if="taskInfo.prompt">
          <view :class="styles['prompt-header']">
            <text :class="styles['label']">提示词 (Prompt)</text>
            <view
              :class="styles['copy-btn']"
              @click="copyText(taskInfo.prompt)"
            >
              <!-- <IconFont name="rect-right" size="12" />  -->
              <text>复制</text>
            </view>
          </view>
          <view :class="styles['prompt-box']">
            {{ taskInfo.prompt }}
          </view>
        </view>
      </view>
    </view>

    <view
      :class="styles['card']"
      v-if="taskInfo.underImageUrl || taskInfo.referImageUrl"
    >
      <view :class="styles['card-header']">
        <IconFont name="image" size="18" color="#7d5fff" />
        <text :class="styles['title']">参考底图</text>
      </view>
      <view :class="styles['images-row']">
        <view
          :class="styles['image-item']"
          v-if="taskInfo.underImageUrl"
          @click="previewImage(taskInfo.underImageUrl)"
        >
          <image
            :src="taskInfo.underImageUrl"
            mode="aspectFill"
            :class="styles['image']"
          />
          <view :class="styles['img-label']">底图</view>
        </view>
        <view
          :class="styles['image-item']"
          v-if="taskInfo.referImageUrl"
          @click="previewImage(taskInfo.referImageUrl)"
        >
          <image
            :src="taskInfo.referImageUrl"
            mode="aspectFill"
            :class="styles['image']"
          />
          <view :class="styles['img-label']">参考图</view>
        </view>
      </view>
    </view>

    <view
      v-if="publishInfo.showPublishBtn"
      :class="[
        styles['publish-btn'],
        {
          [styles['disabled']]:
            !publishInfo.isFromWorks &&
            publishInfo.publishStatus === EPublishStatus.published,
        },
      ]"
      @click="handlePublish"
    >
      {{ publishText }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";
import Taro from "@tarojs/taro";
import { IconFont } from "@nutui/icons-vue-taro";
import {
  EPublishStatus,
  PUBLISH_STATUS_INFO_MAP,
  type IHistoryDetailInfoProps,
} from "./const";
import styles from "./index.module.less";

const props = withDefaults(defineProps<IHistoryDetailInfoProps>(), {});

const emit = defineEmits<{
  (e: "publish"): void;
  (e: "cancelPublish"): void;
}>();

const publishText = computed(() => {
  if (
    props.publishInfo.publishStatus === EPublishStatus.published &&
    !props.publishInfo.isFromWorks
  ) {
    return "已发布";
  }
  return PUBLISH_STATUS_INFO_MAP[props.publishInfo.publishStatus].optionLabel;
});

const handlePublish = () => {
  if (props.publishInfo.publishStatus === EPublishStatus.published) {
    props.publishInfo.isFromWorks && emit("cancelPublish");
    return;
  }
  emit("publish");
};

const copyText = (text: string) => {
  Taro.setClipboardData({
    data: text,
    success: () => {
      Taro.showToast({ title: "已复制", icon: "success" });
    },
  });
};

const previewImage = (url: string) => {
  Taro.previewImage({
    current: url,
    urls: [url],
  });
};

const getModeName = (type: any) => {
  const typeMap = {
    INSPIRATION: "灵感绘图",
    MAKE_UP: "灵感绘图",
    REHABILITATION: "灵感绘图",
    RENDER_LY: "一键渲染",
    LINEAR_RENDER: "线性渲染",
    REDRAW: "局部重绘",
    CLEAN: "智能清除",
    UPSCALE: "高清放大",
    CUTOUT: "一键抠图",
    OBJECT_MIGRATION: "万物迁移",
  };
  return typeMap[type] || "绘图模式";
};
</script>
