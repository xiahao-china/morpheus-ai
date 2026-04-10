<template>
  <Layouts>
    <view :class="pageStyle['not-found-container']">
      <view :class="pageStyle['content-wrapper']">
        <view :class="pageStyle['icon-wrapper']">
          <IconFont :class="pageStyle['not-found-icon']" font-class-name="iconfont" class-prefix="icon" name="tishi" />
        </view>
        <view :class="pageStyle['title']">
          <text :class="pageStyle['main-title']">页面不存在</text>
        </view>
        <view :class="pageStyle['description']">
          <text :class="pageStyle['desc-text']">抱歉，您访问的页面不存在或已删除</text>
        </view>
        <view :class="pageStyle['action-btn']" @click="handleGoHome">
          <text :class="pageStyle['btn-text']">返回首页</text>
        </view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import Taro from '@tarojs/taro';
import { IconFont } from '@nutui/icons-vue-taro';
import Layouts from '@/components/Layouts/index.vue';
import pageStyle from './index.module.less';

const handleGoHome = () => {
  Taro.switchTab({ url: '/pages/Square/index' });
};

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>