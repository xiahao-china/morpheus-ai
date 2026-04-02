<template>
  <view :class="styles.userInfo">
    <!-- 头像部分 -->
    <view :class="styles.avatar">
      <view :class="styles.avatarWrapper">
        <image :src="userInfo.avatar || ''" :class="styles.avatarImage" />
      </view>
    </view>

    <!-- 用户名 -->
    <view :class="styles.nickname">
      {{ userInfo.username || "未设置昵称" }}
    </view>

    <!-- 个人签名 -->
    <view :class="styles.personalSignature">
      {{
        userInfo.personalSignature || "这位设计师还没给签名填充有趣的内容呢~"
      }}
    </view>

    <!-- 操作按钮 -->
    <view :class="styles.actionButtons">
      <view :class="[styles.actionButton, styles.primaryButton]" @click="handleEditClick">
        <Edit :class="styles.icon" />
        <text>编辑资料</text>
      </view>
      <view :class="styles.actionButton" @click="handleContactClick">
        <Service :class="styles.icon" />
        <text>联系客服</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import styles from "./index.module.less";
import type { getUserInfoResponse } from "@/api/users/getUserInfo";
import { Edit, Service } from '@nutui/icons-vue-taro';

defineOptions({
  name: "UserInfo",
});

// 接收 props
const props = defineProps<{
  userInfo: getUserInfoResponse;
}>();

// 定义事件
interface Emits {
  (e: "edit"): void;
  (e: "contact"): void;
}

// 定义事件
const emit = defineEmits<Emits>();

// 处理编辑按钮点击 - 通过emit通知父组件
const handleEditClick = () => {
  emit("edit");
};

const handleContactClick = () => {
  emit("contact");
};
</script>
