<template>
  <Layouts>
    <view class="personal-space">
      <!-- 使用封装的UserInfo组件，支持事件监听和ref调用 -->
      <UserInfo
        :userInfo="userInfo"
        @edit="handleEditProfile"
        @contact="handleContact"
      />
      <!-- Tabs 选项卡 -->
      <UserTabs ref="userTabsRef" />
    </view>

    <nut-popup
      v-model:visible="showContactModal"
      closeable
      round
      :style="{ padding: '40rpx', width: '680rpx' }"
    >
      <view class="contact-modal-content">
        <image
          :src="customerServiceQrCodeImg"
          class="qr-code-img"
          :show-menu-by-longpress="true"
        />
        <view class="contact-tip">长按识别二维码联系客服</view>
      </view>
    </nut-popup>
  </Layouts>
</template>

<script setup lang="ts">
import Layouts from "@/components/Layouts/index.vue";
import UserInfo from "./components/UserInfo/index.vue";
import UserTabs from "./components/UserTabs/index.vue";
import { ref, onMounted } from "vue";
import { getUserInfo, type getUserInfoResponse } from "@/api/users/getUserInfo";
import Taro, { useReachBottom, useDidShow } from "@tarojs/taro";
import customerServiceQrCodeImg from "@/assest/image/navbar/customerServiceQrCodeImg.png";
import { makeUrlAbsolute } from "@/util/url";

const userInfo = ref<getUserInfoResponse>({
  username: "",
  email: "",
  phone: "",
  avatar: null,
  role: "",
  personalSignature: null,
  designerIntroduction: null,
  nickname: null,
  outwardId: null,
  isPassword: false,
  createdTime: "",
});

const showEditDialog = ref(false);
const showContactModal = ref(false);
const userTabsRef = ref();

// 获取用户信息接口
const fetchUserInfo = async () => {
  const res = await getUserInfo();
  if (res instanceof Error || res.code !== 200) {
    console.error("获取用户信息失败:", res);
    return;
  }
  const data = res.data || {};
  if (data.avatar) {
    data.avatar = makeUrlAbsolute(data.avatar);
  }
  userInfo.value = data;
};

// 处理编辑资料事件
const handleEditProfile = () => {
  Taro.navigateTo({
    url: "/packageSettings/pages/EditProfile/index",
  });
};

const handleContact = () => {
  showContactModal.value = true;
};

useReachBottom(() => {
  if (userTabsRef.value) {
    userTabsRef.value.loadData();
  }
});

useDidShow(() => {
  fetchUserInfo();
});

onMounted(() => {
  fetchUserInfo();
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})

</script>

<style lang="less">
.personal-space {
  padding: 40rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.contact-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 20rpx;

  .qr-code-img {
    width: 560rpx;
    height: 560rpx;
    margin-bottom: 24rpx;
  }

  .contact-tip {
    font-size: 28rpx;
    color: #666;
  }
}
</style>
