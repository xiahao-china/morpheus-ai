<template>
  <view :class="pageStyle['serviceInfo']">
    <view :class="pageStyle['shell']">
      <view :class="pageStyle['intro']" v-if="message.status !== 'COMPLETED'">
        <view v-if="message.status === 'FAILED'" :class="pageStyle['failed']">生成失败，请稍后重试</view>
        <view v-else :class="pageStyle['processing']">
          <Refresh :class="pageStyle['spin']" />
          <text>正在为您构思设计方案...</text>
        </view>
      </view>

      <view v-if="message.imageUrl" :class="pageStyle['card']">
        <view :class="pageStyle['imageShell']">
          <image :src="message.imageUrl" mode="aspectFill" :class="pageStyle['image']" />
          <image
            v-if="message.underImageUrl"
            :src="message.underImageUrl"
            mode="aspectFill"
            :class="[pageStyle['image'], pageStyle['underImage'], showUnderImage ? pageStyle['underImageShow'] : '']"
          />
          <view :class="pageStyle['topActionBar']">
            <view
              :class="[pageStyle['topAction'], pageStyle['compareAction']]"
              @touchstart="onComparePress"
              @touchend="onCompareRelease"
            >
              <Star :class="pageStyle['topIcon']" />
            </view>
            <view :class="[pageStyle['topAction'], pageStyle['downloadAction']]" @click="emit('download', message)">
              <Download :class="pageStyle['topIcon']" />
            </view>
          </view>
        </view>
        <view :class="pageStyle['content']">
          <view :class="pageStyle['titleRow']">
            <text :class="pageStyle['title']">AI 生成方案</text>
            <text :class="pageStyle['time']">{{ message.createdTime }}</text>
          </view>

          <view :class="pageStyle['actionRow']">
            <view :class="pageStyle['group']">
              <view :class="pageStyle['action']" @click="emit('like', message)">
                <Star :class="pageStyle['icon']" />
                <text>点赞</text>
              </view>
              <view :class="pageStyle['action']" @click="emit('dislike', message)">
                <Close :class="pageStyle['icon']" />
                <text>点踩</text>
              </view>
            </view>

            <view :class="pageStyle['group']">
              <view :class="pageStyle['action']" @click="emit('regenerate', message)">
                <Refresh :class="pageStyle['icon']" />
                <text>重试</text>
              </view>
              <view :class="pageStyle['action']" @click="emit('publish', message)">
                <ArrowRight :class="pageStyle['icon']" />
                <text>发布</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Taro from "@tarojs/taro";
import { ArrowRight, Close, Download, Refresh, Star } from "@nutui/icons-vue-taro";
import type { IServiceInfoProps } from "./const";
import type { IDrawingV2Message } from "@/pages/DrawingV2/const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IServiceInfoProps>(), {} as IServiceInfoProps);
const showUnderImage = ref(false);

const emit = defineEmits<{
  like: [message: IDrawingV2Message];
  dislike: [message: IDrawingV2Message];
  publish: [message: IDrawingV2Message];
  regenerate: [message: IDrawingV2Message];
  download: [message: IDrawingV2Message];
}>();

const onComparePress = () => {
  if (!props.message.underImageUrl) {
    Taro.showToast({ title: "没有底图无法对比", icon: "none" });
    showUnderImage.value = false;
    return;
  }
  showUnderImage.value = true;
};

const onCompareRelease = () => {
  showUnderImage.value = false;
};
</script>
