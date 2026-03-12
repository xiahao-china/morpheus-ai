<template>
  <view
    :class="[pageStyle['navigation-bar'], showLogoAndTitle ? '' : pageStyle['normal-bar']]"
    :style="{ background: navBackground }"
  >
    <view v-if="showLogoAndTitle" :class="pageStyle['app-info']" @click="toHome" :style="{ paddingTop: navTopPadding + 'px' }">
      <view :class="pageStyle['left-block']">
        <view :class="pageStyle['app-title']">
          <text>灵感广场</text>
          <view :class="pageStyle['title-dot']"></view>
        </view>
        <view :class="pageStyle['app-subtitle']">DISCOVER DESIGN FUTURE</view>
      </view>

      <view :class="pageStyle['right-block']">
        <view :class="pageStyle['avatar-wrapper']">
          <image mode="aspectFill" :src="NAVIGATION_ASSETS.appLogoImg" :class="pageStyle['avatar']"/>
          <view :class="pageStyle['avatar-ring']"></view>
          <view :class="pageStyle['status-dot']"></view>
        </view>
      </view>

    </view>
    <view v-else :class="pageStyle['normal-bar']" :style="{ paddingTop: navTopPadding + 'px' }">
      <Left :class="pageStyle['left-icon']" @click="closeCurrentPage"/>
      <view :class="pageStyle['page-name']">{{ currentPageName }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import pageStyle from './index.module.less'
import {
  type NavigationBarProps,
  defaultNavigationBarProps,
  NAVIGATION_ASSETS,
  getCurrentPageName,
  getCustomBackground,
  shouldShowLogoAndTitle,
  navigateToHome, getCurrentPageConfig
} from './const'
import Taro from "@tarojs/taro";
import { Left } from '@nutui/icons-vue-taro';

const props = withDefaults(defineProps<NavigationBarProps>(), defaultNavigationBarProps)
const navTopPadding = ref(49);


// 计算自定义背景样式
const customBackground = computed(() => {
  return getCustomBackground(props.backgroundColor)
})

// 获取当前页面名称
const currentPageName = computed(() => {
  return getCurrentPageName()
})

// 判断是否显示logo和标题
const showLogoAndTitle = computed(() => {
  return shouldShowLogoAndTitle(props.showLogoAndTitle)
})

const navBackground = computed(() => {
  if (props.backgroundColor) {
    return props.backgroundColor
  }
  if (props.showLogoAndTitle) {
    return undefined
  }
  return 'white'
})

// 导航到首页
const toHome = () => {
  navigateToHome()
}

const closeCurrentPage = async () => {
  const pageInfo = await Taro.getCurrentPages();
  if (pageInfo.length <= 1) {
    Taro.redirectTo({
      url: '/pages/Square/index'
    })
   return;
  }
  Taro.navigateBack({
    delta: 1
  })
}

onMounted(() => {
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEB) {
    navTopPadding.value = 49;
  } else {
    const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
    let topCenterPos = menuButtonInfo.top + ((menuButtonInfo.height - 40) / 2);
    navTopPadding.value = topCenterPos;
  }
})
</script>

<style lang="less" scoped>
/* 组件特定样式 */
</style>
