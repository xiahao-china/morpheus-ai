<template>
  <view :class="styles.services">
    <view :class="styles.container">
      <!-- 标题区域 -->
      <view :class="styles.sectionHeader">
        <text :class="styles.sectionTitle">核心服务优势</text>
        <text :class="styles.sectionDescription">专业的AI设计服务，为您提供全方位的创意解决方案</text>
      </view>

      <!-- 顶部标签导航 -->
      <view :class="styles.serviceTabs">
        <scroll-view
          :class="styles.tabsScroll"
          scroll-x
          :scroll-left="tabScrollLeft"
          show-scrollbar="false"
        >
          <view :class="styles.tabsContainer">
            <view
              v-for="(service, index) in services"
              :key="index"
              :class="[styles.tabItem, { [styles.active]: index === currentIndex }]"
              @click="switchService(index)"
            >
              <text :class="styles.tabText">{{ service.title }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 服务内容卡片 -->
      <swiper
        :class="styles.serviceSwiper"
        :current="currentIndex"
        @change="onSwiperChange"
        duration="300"
        easing-function="easeInOutCubic"
      >
        <swiper-item
          v-for="(service, index) in services"
          :key="index"
          :class="styles.swiperItem"
        >
          <view :class="styles.serviceCard">
            <!-- 服务图片 -->
            <view :class="styles.serviceImage">
              <image
                :src="service.image"
                mode="aspectFill"
                :class="styles.cardImage"
              />
              <view
                :class="styles.imageOverlay"
                :style="{ background: service.gradient }"
              ></view>
            </view>

            <!-- 服务内容 -->
            <view :class="styles.serviceContent">
              <view :class="styles.serviceHeader">
                <view
                  :class="styles.serviceIcon"
                  :style="{ background: service.gradient }"
                >
                  <text :class="styles.iconText">{{ getServiceIcon(index) }}</text>
                </view>
                <text :class="styles.serviceTitle">{{ service.title }}</text>
              </view>

              <text :class="styles.serviceDescription">{{ service.description }}</text>

              <!-- 特色功能 -->
              <view :class="styles.serviceFeatures">
                <view
                  v-for="feature in service.features.slice(0, 3)"
                  :key="feature"
                  :class="styles.featureItem"
                >
                  <text :class="styles.featureIcon">✓</text>
                  <text :class="styles.featureText">{{ feature }}</text>
                </view>
              </view>

              <!-- 操作按钮 -->
              <view
                :class="styles.serviceBtn"
                :style="{ background: service.gradient }"
                @click="toDraw"
              >
                <text :class="styles.btnText">立即体验</text>
                <text :class="styles.btnArrow">→</text>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <!-- 指示器 -->
      <view :class="styles.swiperIndicators">
        <view
          v-for="(service, index) in services"
          :key="index"
          :class="[styles.indicator, { [styles.active]: index === currentIndex }]"
        ></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import { SERVICES_INTRODUCTION_DATA } from './const'

// 导入 CSS Module 样式
import styles from './index.module.less'

const currentIndex = ref(0)
const services = ref(SERVICES_INTRODUCTION_DATA)
const tabScrollLeft = ref(0)

// 服务图标映射
const getServiceIcon = (index: number) => {
  const icons = ['🎨', '🏠', '💡', '🔧']
  return icons[index] || '⭐'
}

// 切换服务
const switchService = (index: number) => {
  currentIndex.value = index
  updateTabScroll(index)
}

// Swiper 变化事件
const onSwiperChange = (e: any) => {
  const { current } = e.detail
  currentIndex.value = current
  updateTabScroll(current)
}

// 更新标签滚动位置
const updateTabScroll = (index: number) => {
  nextTick(() => {
    // 简单的滚动计算，每个标签约100rpx宽度
    const scrollLeft = Math.max(0, (index - 1) * 100)
    tabScrollLeft.value = scrollLeft
  })
}

// 使用 Taro 路由 API 跳转到应用页面
const toDraw = () => {
  Taro.navigateTo({
    url: '/pages/app/index'
  })
}
</script>
