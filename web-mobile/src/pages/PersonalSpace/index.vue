<template>
  <Layouts>
    <view :class="styles.personalSpace">
      <!-- User Info Card -->
      <view :class="styles.userInfoCard" @tap="handleEditProfile">
        <view :class="styles.avatarWrapper">
          <image
            :src="userStore.avatar || defaultAvatar"
            mode="aspectFill"
            :class="styles.avatar"
          />
        </view>
        <view :class="styles.infoContent">
          <view :class="styles.nickname">{{ userStore.name || '未登录用户' }}</view>
          <view :class="styles.signature">
            {{ userStore.personalSignature || '追求极致美学的家装爱好者' }}
          </view>
          <view :class="styles.tagsRow">
            <view :class="styles.memberTag">PRO 会员</view>
            <view :class="styles.pointsTag">积分: {{ userStore.points || 0 }}</view>
          </view>
        </view>
      </view>

      <!-- Content Management Menu -->
      <view :class="styles.menuCard">
        <view :class="styles.cardTitle">内容管理</view>

        <view :class="styles.menuItem" @tap="navigateTo('/pages/MySpace/index')">
          <view :class="styles.menuIcon">
            <IconFont font-class-name="iconfont" class-prefix="icon" name="history" size="20" />
          </view>
          <view :class="styles.menuLabel">个人空间</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>

        <view :class="styles.menuItem" @tap="navigateTo('/pages/Fengshui/index')">
          <view :class="styles.menuIcon">
            <IconFont font-class-name="iconfont" class-prefix="icon" name="fengshui" size="20" />
          </view>
          <view :class="styles.menuLabel">风水报告</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>

        <view :class="styles.menuItem" @tap="showToast('功能开发中')">
          <view :class="styles.menuIcon">
            <Heart size="20" />
          </view>
          <view :class="styles.menuLabel">我的收藏</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>
      </view>

      <!-- General Menu -->
      <view :class="styles.menuCard">
        <view :class="styles.menuItem" @tap="showToast('功能开发中')">
          <view :class="styles.menuIcon">
            <Order size="20" />
          </view>
          <view :class="styles.menuLabel">订单与订阅</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>

        <view :class="styles.menuItem" @tap="handleContact">
          <view :class="styles.menuIcon">
            <Service size="20" />
          </view>
          <view :class="styles.menuLabel">联系客服</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>

        <view :class="styles.menuItem" @tap="showToast('功能开发中')">
          <view :class="styles.menuIcon">
            <Ask size="20" />
          </view>
          <view :class="styles.menuLabel">用户指南</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>

        <view :class="styles.menuItem" @tap="navigateTo('/packageSettings/pages/EditProfile/index')">
          <view :class="styles.menuIcon">
            <Setting size="20" />
          </view>
          <view :class="styles.menuLabel">账户设置</view>
          <RectRight :class="styles.menuArrow" size="16" />
        </view>
      </view>

      <!-- Version Info -->
      <view :class="styles.versionInfo">暖界AI Version 2.4.0</view>
    </view>

    <!-- Contact Modal -->
    <nut-popup
      v-model:visible="showContactModal"
      round
      :style="{ backgroundColor: 'transparent'}"
    >
    <view :class="styles['contact-modal-content-shell']">
      <view :class="styles['contact-modal-content']">
        <image
          :src="`${STATIC_ASSETS_URL}/navbar/customerServiceQrCodeImg.png`"
          :class="styles['qr-code-img']"
          :show-menu-by-longpress="true"
        />
        <view :class="styles['contact-tip']">长按识别二维码联系客服</view>
      </view>
       <view :class="styles['close-btn']" @tap="showContactModal = false">
          <Close :class="styles['close-btn-icon']" />
        </view>
    </view>

    </nut-popup>
  </Layouts>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Taro, { useDidShow } from "@tarojs/taro";
import Layouts from "@/components/Layouts/index.vue";
import { getUserInfo } from "@/api/users/getUserInfo";
import { STATIC_ASSETS_URL } from "@/constants";
import defaultAvatar from '@/assest/image/logo.png';
import { useUserStore } from "@/store/user";
import {
  Heart,
  Order,
  Service,
  Ask,
  Setting,
  RectRight,
  IconFont,
  Close
} from '@nutui/icons-vue-taro';
import styles from "./index.module.less";

const userStore = useUserStore();
const showContactModal = ref(false);

const fetchUserInfo = async () => {
  try {
    await userStore.initLoginInfo();
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }
};

const handleEditProfile = () => {
  Taro.navigateTo({
    url: "/packageSettings/pages/EditProfile/index",
  });
};

const handleContact = () => {
  showContactModal.value = true;
};

const navigateTo = (url: string) => {
  Taro.navigateTo({ url });
};

const showToast = (msg: string) => {
  Taro.showToast({ title: msg, icon: 'none' });
};

useDidShow(() => {
  fetchUserInfo();
});

onMounted(() => {
  fetchUserInfo();
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
});
</script>
