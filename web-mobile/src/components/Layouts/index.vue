<template>
  <view :class="[pageStyle['app-layout'], !webNavCheck ? pageStyle['app-layout-mobile']: undefined]">
    <!-- 根据配置控制NavigationBar显示 -->
    <NavBar
      v-if="webNavCheck"
      :show-logo-and-title="showNavigationBar"
      :background-color="navBackgroundColor"
    />
    <view :class="pageStyle['app-layout-content']">
      <slot />
    </view>
    <!-- 根据配置控制BottomNavigation显示 -->
    <BottomNavigation v-if="showBottomNavigation" />
  </view>
</template>

<script setup lang="ts">
import {computed, onMounted} from "vue";
import BottomNavigation from "@/components/BottomNavigation/index.vue";
import NavBar from "@/components/NavBar/index.vue";
import {useUserStore} from "@/store";
import pageStyle from "./index.module.less";
import {
  type LayoutProps,
  defaultLayoutProps,
  getCurrentPageConfig,
  shouldShowNavigationBar,
  shouldShowBottomNavigation,
  getNavigationBarBackgroundColor,
} from "./const";
import {reportPage} from "@/api/system/config/grafana";
import {onceGetTemporaryLoginInfo} from "@/pages/LoginPage/components/WxLogin/const";
import Taro from "@tarojs/taro";
import {STATIC_ASSETS_URL} from "@/constants";
import {getIsWeb} from "@/util/envCheck";

const props = withDefaults(defineProps<LayoutProps>(), defaultLayoutProps);
// 进入即加载用户信息
const isWeb = getIsWeb();


// 获取当前页面配置
const currentPageConfig = computed(() => {
  const config = getCurrentPageConfig();
  return config.config;
});

// 控制NavigationBar显示
const showNavigationBar = computed(() => {
  return shouldShowNavigationBar(currentPageConfig.value);
});

// 控制BottomNavigation显示
const showBottomNavigation = computed(() => {
  return shouldShowBottomNavigation(currentPageConfig.value);
});

// NavigationBar的背景色控制
const navBackgroundColor = computed(() => {
  return getNavigationBarBackgroundColor(props.navBackgroundColor);
});

const webNavCheck = computed(() => {
  if (!isWeb) return true;
  return currentPageConfig.value?.needMobileNav
})



Taro.useShareAppMessage((res) => {
  if (res.from === 'button') {
    // 来自页面内转发按钮
    console.log(res.target)
  }
  return {
    title: '推敲-让设计更合心意',
    path: '/page/Square/index',
  }
})

Taro.useShareTimeline(() => {
  return {
    title: '推敲-让设计更合心意',
    imageUrl: `${STATIC_ASSETS_URL}/banner/draw.png`
  }
})

onMounted(async ()=>{
  const userStore = useUserStore();
  await userStore.initLoginInfo();
  if (!userStore.isPhone && !getIsWeb()) {
    await onceGetTemporaryLoginInfo();
    return;
  }
  const config = getCurrentPageConfig();
  reportPage({
    tags:{
      event_type: 'page_browse'
    },
    fields:{
      user_id: userStore.id || '',
      path: config.route,
    },
    timestamp: Date.now() * 1e6,
  })
})
</script>

<style lang="less" scoped></style>
