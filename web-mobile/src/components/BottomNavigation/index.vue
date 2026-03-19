<template>
  <view :class="styles.bottomNavigation" :style="bottomNavigationStyle">
    <view
      :class="styles.activeIndicator"
      :style="activeIndicatorStyle"
    >
      <IconFont
        v-if="activeNavItem"
        :class="styles.activeIndicatorIcon"
        font-class-name="iconfont"
        class-prefix="icon"
        :name="activeNavItem.icon"
      />
    </view>
    <view
      v-for="item in navItems"
      :key="item.key"
      :class="[styles.navItem, { [styles.active]: activeTab === item.key }]"
      @click="handleNavClick(item)"
    >
      <view :class="styles.navIcon">
        <IconFont :class="styles.iconfont" font-class-name="iconfont" class-prefix="icon" :name="item.icon" />
      </view>
      <view :class="styles.navLabel">{{ item.label }}</view>

      <view :class="styles.ripple"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import Taro from "@tarojs/taro";
import { navItems } from "@/components/BottomNavigation/const";
import styles from "./index.module.less";
import {IconFont} from "@nutui/icons-vue-taro";

const activeTab = ref("draw");
const activeIndex = computed(() => {
  const index = navItems.findIndex((item) => item.key === activeTab.value);
  return index >= 0 ? index : 0;
});
const activeNavItem = computed(() => navItems[activeIndex.value]);
const bottomNavigationStyle = computed(() => ({
  '--nav-count': String(navItems.length),
}));

const activeIndicatorStyle = computed(() => ({
  left: `${((activeIndex.value + 0.5) * 100) / navItems.length}%`,
}));

const resolveActiveByPath = (path: string) => {
  if (!path) return;
  const clean = path.split('?')[0];
  const activeItem = navItems.find(
    (item) => clean.startsWith(item.path) || clean === item.path
  );
  activeTab.value = activeItem?.key || "draw";
};

const getCurrentPage = () => {
  const instancePath = Taro.getCurrentInstance()?.router?.path || '';
  if (instancePath) {
    resolveActiveByPath(instancePath);
    return;
  }
  const pages = Taro.getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    resolveActiveByPath(`/${currentPage.route}`);
    return;
  }
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    const hashPath = hash.startsWith('#') ? hash.slice(1) : hash;
    resolveActiveByPath(hashPath);
  }
};

const handleNavClick = (item: any) => {
  const path = item?.path;
  if (!path) return;

  let currentPath = '';
  const pages = Taro.getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    currentPath = `/${currentPage.route}`;
  }
  if (currentPath === path) return;
  Taro.navigateTo({
    url: path,
  });

};

onMounted(() => {
  getCurrentPage();
});
</script>
