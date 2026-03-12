<template>
  <view :class="styles.hero">
    <view :class="styles.container">
      <view :class="styles.heroVisualShell">
        <view :class="styles.mask"/>
        <!-- 使用 NutUI 的 Swiper 组件替换 ElCarousel -->
        <nut-swiper
          :init-page="0"
          :pagination-visible="false"
          :auto-play="1000"
          :class="styles.heroVisualSwiper"
        >
          <nut-swiper-item v-for="(image, index) in CAROUSEL_IMAGE" :key="index">
            <image :class="styles.heroVisual" :src="image" mode="aspectFill" />
          </nut-swiper-item>
        </nut-swiper>
      </view>

      <view :class="[styles.heroStats, 'fade-in-up']">
        <view :class="styles.statItem">
          <view :class="styles.statNumber">1W+</view>
          <view :class="styles.statLabel">渲染累计</view>
        </view>
        <view :class="styles.statItem">
          <view :class="styles.statNumber">{{'<'}}1Min</view>
          <view :class="styles.statLabel">快速生成</view>
        </view>
        <view :class="styles.statItem">
          <view :class="styles.statNumber">20+</view>
          <view :class="styles.statLabel">丰富定制选择</view>
        </view>
      </view>

      <view :class="styles.heroContent">
        <view :class="[styles.heroText, 'fade-in-left']">
          <text :class="styles.heroTitle">
            推敲一下，
            <text :class="styles.highlight">让设计更合心意</text>
          </text>
          <text :class="styles.heroDescription">
            专注建筑室内设计的AI创意生成工具，为您量身定制完美的居住空间
          </text>
          <view :class="styles.heroButtons">
            <button :class="[styles.startBtn, styles.btn, styles.btnPrimary]" @click="toDraw">
              开始推敲
              <view :class="styles.btnIcon">
                <text>→</text>
              </view>
            </button>
            <button :class="[styles.seeSimple, styles.btn, styles.btnSecondary]" @click="simpleVide">
              <view :class="styles.btnIcon">
                <text>▶</text>
              </view>
              观看演示
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import Taro from '@tarojs/taro'
import { CAROUSEL_IMAGE } from './const'
console.log(CAROUSEL_IMAGE);

import styles from './index.module.less'


import { useUserStore } from '@/store'

const userStore = useUserStore()

// 使用 Taro 路由 API 替换 Vue Router
const toDraw = () => {
  if (userStore.name) {
    Taro.navigateTo({
      url: '/pages/app/index'
    })
  } else {
    Taro.navigateTo({
      url: '/pages/LoginPage/index'
    })
  }
}

// 小程序环境下无法直接使用 window.open，需要使用复制链接或其他方式
const simpleVide = () => {
  // 在小程序中，可以使用 Taro.setClipboardData 复制链接
  Taro.setClipboardData({
    data: 'https://star-ai-xyc.feishu.cn/wiki/Zwh3wnxbIi1bXZksuAacxjYMnbc',
    success: () => {
      Taro.showToast({
        title: '链接已复制到剪贴板',
        icon: 'success'
      })
    }
  })
}
</script>
