<template>
  <view :class="styles.productShowcase">
    <view :class="styles.container">
      <!-- 标题区域 -->
      <view :class="styles.sectionHeader">
        <text :class="styles.sectionTitle">作品展示</text>
        <text :class="styles.sectionDescription">
          AI生成的精美室内设计案例，每一个都是独一无二的艺术品
        </text>
      </view>

      <!-- 顶部分类标签导航 -->
      <view :class="styles.categoryTabs">
        <scroll-view
          :class="styles.tabsScroll"
          scroll-x
          :scroll-left="tabScrollLeft"
          show-scrollbar="false"
        >
          <view :class="styles.tabsContainer">
            <view
              v-for="(category, index) in categories"
              :key="index"
              :class="[styles.tabItem, { [styles.active]: activeCategory === category.id }]"
              @click="switchCategory(category.id, index)"
            >
              <text :class="styles.tabText">{{ category.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 作品展示网格 -->
      <swiper
        :class="styles.showcaseSwiper"
        :current="currentCategoryIndex"
        @change="onSwiperChange"
        duration="300"
        easing-function="easeInOutCubic"
      >
        <swiper-item
          v-for="(category, categoryIndex) in categories"
          :key="categoryIndex"
          :class="styles.swiperItem"
        >
          <view :class="styles.worksContainer">
            <view :class="styles.worksGrid">
              <view
                v-for="(image, index) in getCategoryImages(category.id)"
                :key="index"
                :class="styles.workItem"
                @click="openLightbox(image)"
              >
                <view :class="styles.workImageWrapper">
                  <image
                    :src="image.url"
                    mode="aspectFill"
                    :class="styles.workImage"
                  />
                  <view :class="styles.imageOverlay">
                    <view :class="styles.overlayIcon">👁</view>
                  </view>
                </view>

                <view :class="styles.workInfo">
                  <text :class="styles.workTitle">{{ image.title }}</text>
                </view>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <!-- 指示器 -->
      <view :class="styles.swiperIndicators">
        <view
          v-for="(category, index) in categories"
          :key="index"
          :class="[styles.indicator, { [styles.active]: index === currentCategoryIndex }]"
        ></view>
      </view>
    </view>

    <!-- 使用 NutUI 的 Popup 组件替换 Lightbox Modal -->
    <nut-popup
      v-model:visible="lightboxOpen"
      position="center"
      :style="{ width: '90vw', height: '65vh' }"
      closeable
      @close="closeLightbox"
    >
      <view v-if="currentImage" :class="styles.lightboxContent">
        <image :src="currentImage.url" mode="aspectFit" :class="styles.lightboxImage" />
        <view :class="styles.lightboxInfo">
          <text :class="styles.lightboxTitle">{{ currentImage.title }}</text>
          <text :class="styles.lightboxDescription">{{ currentImage.description }}</text>
        </view>
      </view>
    </nut-popup>
  </view>
</template>



<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ALL_IMAGES_STATIC_DATA, CATEGORIES_STATIC_DATA, type IImagesStaticData } from './const'

// 导入 CSS Module 样式
import styles from './index.module.less'

const activeCategory = ref('living') // 修复：设置为第一个分类的id
const currentCategoryIndex = ref(0)
const lightboxOpen = ref(false)
const currentImage = ref<IImagesStaticData | null>(null)
const tabScrollLeft = ref(0)

const categories = ref(CATEGORIES_STATIC_DATA)
const allImages = ref(ALL_IMAGES_STATIC_DATA)

// 根据分类获取图片列表 - 每个分类显示6张图片
const getCategoryImages = (categoryId: string) => {
  return allImages.value.filter(img => img.category === categoryId).slice(0, 6)
}

// 切换分类
const switchCategory = (categoryId: string, index: number) => {
  activeCategory.value = categoryId
  currentCategoryIndex.value = index
  updateTabScroll(index)
}

// Swiper 变化事件
const onSwiperChange = (e: any) => {
  const { current } = e.detail
  currentCategoryIndex.value = current
  activeCategory.value = categories.value[current].id
  updateTabScroll(current)
}

// 更新标签滚动位置
const updateTabScroll = (index: number) => {
  nextTick(() => {
    // 简单的滚动计算，每个标签约120rpx宽度
    const scrollLeft = Math.max(0, (index - 1) * 120)
    tabScrollLeft.value = scrollLeft
  })
}

// 根据分类 ID 获取分类名称
const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId
}

// 打开图片详情弹窗
const openLightbox = (item: IImagesStaticData) => {
  currentImage.value = item
  lightboxOpen.value = true
}

// 关闭图片详情弹窗
const closeLightbox = () => {
  lightboxOpen.value = false
  currentImage.value = null
}
</script>
