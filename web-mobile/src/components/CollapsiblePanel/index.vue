<template>
  <view :class="[styles.collapsiblePanelContainer, isPluginContainer ? styles.pluginContainer : '']">
    <!-- 上侧：标题与展开按钮 -->
    <view :class="styles.panelHeader">
      <view :class="styles.panelTitle">
        <text :class="styles.titleText">{{ title }}</text>
        <view v-if="tip" :class="styles.questionIcon" @tap="showTip">
          <!-- <nut-icon name="help" size="16"></nut-icon> -->
        </view>
      </view>
      <view :class="styles.panelRightContent">
        <slot name="top-right"></slot>
        <view v-if="!notCollapsed" :class="styles.switchContainer">
          <nut-switch v-model="isExpanded" @change="toggleExpand" />
        </view>
      </view>
    </view>
    <!-- 下侧：内容区域，根据展开状态显示 -->
    <view
      :class="[styles.detailCollapse, (isExpanded || notCollapsed) ? styles.overflowShow : '']"
      :style="{ height: (isExpanded || notCollapsed) ? 'auto' : '0' }"
    >
      <view v-if="isExpanded || notCollapsed" :class="styles.collapseContent">
        <slot></slot>
      </view>
    </view>

    <!-- 提示信息弹窗 -->
    <nut-popup v-model:visible="tipVisible" position="center" :style="{ padding: '20px' }">
      <view style="text-align: center;">
        <text>{{ tip }}</text>
      </view>
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, withDefaults } from 'vue';
// 导入CSS Module样式
import styles from './index.module.less';

// 定义组件属性接口
interface Props {
  title: string;
  notCollapsed?: boolean;
  tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  notCollapsed: false,
  tip: '',
});

// 响应式数据
const isExpanded = ref(props.notCollapsed ? true : false);
const isPluginContainer = ref(false); // 小程序环境下默认为false
const tipVisible = ref(false);

/**
 * 切换展开/收起状态
 * @param val 新的展开状态
 */
const toggleExpand = (val: boolean | string | number) => {
  isExpanded.value = Boolean(val);
};

/**
 * 显示提示信息
 */
const showTip = () => {
  if (props.tip) {
    tipVisible.value = true;
  }
};
</script>
