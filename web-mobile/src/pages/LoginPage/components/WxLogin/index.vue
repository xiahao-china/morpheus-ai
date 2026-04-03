<template>
  <view :class="pageStyle['wx-login']">

    <view :class="pageStyle['user-icon-container']">
      <IconFont :class="pageStyle['user-icon']" font-class-name="iconfont" class-prefix="icon" name="user" />
    </view>

    <text :class="pageStyle['hint-text']">快速验证您的手机号</text>

    <nut-button
      type="primary"
      :class="pageStyle['login-btn']"
      openType="getPhoneNumber"
      @getphonenumber="wxOneClickLogin"
    >
      <view :class="pageStyle['login-btn-text']">
        <text>登录</text>
      </view>
    </nut-button>
    <view :class="pageStyle['agreement-wrapper']">
      <LoginAgreement ref="agreementRef" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { IconFont } from '@nutui/icons-vue-taro';

import {wxMiniProgramLogin} from "@/api/users/wxMiniProgramLogin";
import {saveCookie} from "@/util/cookie";
import {checkBackPath} from "@/pages/LoginPage/const";
import {useUserStore} from "@/store";

import {getTemporaryLoginInfo, IGetphonenumberData} from './const';
import pageStyle from './index.module.less'
import LoginAgreement from '../LoginAgreement/index.vue'
import { ensureAgreementBefore } from '../LoginAgreement/const'


// const emit = defineEmits<{ 'bindPhone':[IWxLoginBindPhoneData] }>()
const userStore = useUserStore()
const agreementRef = ref<any>(null)



// 微信一键登录
const wxOneClickLogin = async (phoneInfo: IGetphonenumberData) => {
  if (!ensureAgreementBefore(agreementRef.value, () => wxOneClickLogin(phoneInfo))) return
  if (!phoneInfo.detail.code){
    Taro.showToast({
      title: '请授权手机号',
      icon: 'none',
      duration: 1000
    });
    return;
  }

  const loginRes = await Taro.login();
  const response = await wxMiniProgramLogin({
    ...phoneInfo.detail,
    loginCode: loginRes.code,
    userId: userStore.id?.toString() || '',
  })
  if (response instanceof Error || response.data.code !== 200) {
    console.error(response);
    getTemporaryLoginInfo();
    return;
  }
  // 检查响应头中是否有 set-cookie
  const setCookieHeader =
    response.headers["set-cookie"] || response.headers["Set-Cookie"];
  if (setCookieHeader) {
    // 保存 Cookie 到本地存储
    saveCookie(setCookieHeader.replace(/,/g, ";"));
  }
  Taro.showToast({
    title: '登录成功,即将为您跳转~',
    icon: 'success',
    duration: 1000
  });
  userStore.initLoginInfo();
  setTimeout(() => {
    checkBackPath('/pages/DrawingV2/index');
  }, 500)
};


</script>

<!--<style lang="less" scoped>-->
<!--@import './index.less';-->
<!--</style>-->
