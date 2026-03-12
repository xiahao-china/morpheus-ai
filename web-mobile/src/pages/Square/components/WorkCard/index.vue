<template>
  <view :class="pageStyle['work-card']">
    <view
      :class="[
        pageStyle['card-content-wrapper'],
        { [pageStyle['loading']]: workDetailInfoLoading },
      ]"
      :style="calcHeight ? { height: calcHeight } : undefined"
    >
      <view @click="handleImgClick">
        <image
          :src="info.workImg"
          mode="widthFix"
          :class="pageStyle['card-image']"
          @load="onImageLoad"
        />
      </view>
      <view v-if="workDetailInfoLoading" :class="pageStyle['loading-overlay']">
        <view :class="pageStyle['loading-spinner']"></view>
      </view>
    </view>
    <view :class="pageStyle['card-body']">
      <text :class="pageStyle['card-title']">{{
        info.title || "未知标题"
      }}</text>
      <view :class="pageStyle['card-footer']">
        <view :class="pageStyle['author']">
          <image
            :src="info.avatar"
            mode="aspectFill"
            :class="pageStyle['card-avatar']"
          />
          <text :class="pageStyle['author-name']">{{
            info.name || "未知用户"
          }}</text>
        </view>
        <view
          :class="[
            pageStyle['like-block'],
            { [pageStyle['active']]: info.hasLike },
          ]"
          @click="handleLike"
        >
          <IconFont
            :class="pageStyle['like-icon']"
            font-class-name="iconfont"
            class-prefix="icon"
            name="icon_love_hover"
          />
          <text :class="pageStyle['card-stats']">{{ likeCount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, withDefaults, defineProps } from "vue";
import { IconFont } from "@nutui/icons-vue-taro";
import { turnNumberToString, turnToScreenSizePx } from "@/constants/util";
import { collectSquare } from "@/api/square/collectSquare";
import type { IObject } from "@/constants/types";
import { handle401ToLogin } from "@/lib/router/config";

import type { IWorkCardProps } from "./const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IWorkCardProps>(), {});
const workDetailInfoLoading = ref<boolean>(false);
const emit = defineEmits<{
  imgLoad: [calcImgHeight: number];
  clickImg: [string];
  collect: [boolean];
}>();

const likeCount = computed(() => turnNumberToString(props.info.likeCount));
const calcHeight = computed(() => turnToScreenSizePx(props.info.calcImgHeight));

const loadWorkInfo = async () => {
  return props.info.workId;
};

// 移除画同款按钮相关逻辑
const onImageLoad = (e) => {
  // 获取图片宽高
  const oImgW = e.detail.width; //图片原始宽度
  const oImgH = e.detail.height; //图片原始高度
  const imgWidth = 331; //图片设置的宽度
  const scale = imgWidth / oImgW; //比例计算
  const calcImgHeight = Math.round(oImgH * scale); //自适应高度
  emit("imgLoad", calcImgHeight);
  return;
};

const handleLike = async () => {
  const response = await collectSquare(props.info.workId);
  console.log(response);
  if (response instanceof Error || response.code !== 200) {
    if ((response as IObject).status === 401) {
      handle401ToLogin(true);
    }
    return;
  }
  emit("collect", !props.info.hasLike);
};

const handleImgClick = async () => {
  // const workInfo = await loadWorkInfo();
  emit("clickImg", props.info.workId);
};
</script>

<style lang="less" scoped></style>
