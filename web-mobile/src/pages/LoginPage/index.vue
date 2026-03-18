<template>
  <Layouts>
    <RootPortalEl>
      <view :class="pageStyle['login-container']">
        <view :class="pageStyle['login-card']">
          <template v-if="loginMainStep === ELoginMainStepType.login">
            <view :class="pageStyle['login-card-content']">
              <view :class="pageStyle['card-header']">
                <view :class="pageStyle['logo']">
                  <image :class="pageStyle['logo-icon']" :src="logoImg" />
                  <text :class="pageStyle['logo-text']">暖界AI</text>
                </view>
                <view :class="pageStyle['title']">
                  <text :class="pageStyle['main-title']">登录账号</text>
                  <text :class="pageStyle['sub-title']">未注册手机号验证通过后将自动创建账号</text>
                </view>
              </view>

              <view :class="pageStyle['custom-tabs']">
                <view
                  :class="[pageStyle['tab-item'], { [pageStyle['active']]: activeTab === 'wxQrCode' }]"
                  @click="()=>changeActiveTab('wxQrCode')"
                >
                  <IconFont :class="pageStyle['tab-icon']" font-class-name="iconfont" class-prefix="icon" name="weixin" />
                  <text>微信登录</text>
                </view>
                <view
                  :class="[pageStyle['tab-item'], { [pageStyle['active']]: activeTab === 'phone' }]"
                  @click="activeTab = 'phone'"
                >
                  <IconFont :class="pageStyle['tab-icon']" font-class-name="iconfont" class-prefix="icon" name="shouji" />
                  <text>手机号</text>
                </view>
              </view>

              <view :class="pageStyle['tab-content']">
                <view v-if="activeTab === 'wxQrCode' && isMiniProgramEnv">
                  <WxLogin @bind-phone="handleWxLoginBindPhone" />
                </view>
                <view v-if="activeTab === 'phone'">
                  <PhoneLogin />
                </view>
              </view>
            </view>
          </template>

          <template v-if="loginMainStep === ELoginMainStepType.bindPhone">
            <view :class="pageStyle['login-card-content']">
              <view :class="pageStyle['card-header']">
                <view :class="pageStyle['logo']">
                  <image :class="pageStyle['logo-icon']" :src="logoImg" />
                  <text :class="pageStyle['logo-text']">暖界AI</text>
                </view>
                <view :class="pageStyle['title']">
                  <text :class="pageStyle['main-title']">绑定手机号</text>
                  <text :class="pageStyle['sub-title']">未注册的微信号登录时，将自动创建暖界AI账号</text>
                </view>
              </view>
              <PhoneLogin :is-bind-phone="true" />
            </view>
          </template>

          <view :class="pageStyle['footer-disclaimer']">
            AI 生成内容具有随机性，请仔细甄别 • 暖界AI
          </view>
        </view>
      </view>
    </RootPortalEl>
  </Layouts>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {IconFont, Service} from '@nutui/icons-vue-taro';
import Taro from '@tarojs/taro';
import { useUserStore } from '@/store';
import {getIsWeb, isMiniProgram} from "@/util/envCheck";
import Layouts from "@/components/Layouts/index.vue";
import RootPortalEl from '@/components/RootPortalEl/index.vue'

import WxLogin from './components/WxLogin/index.vue';
import type { IWxLoginBindPhoneData } from './components/WxLogin/const';
import PhoneLogin from './components/PhoneLogin/index.vue';
import { ELoginMainStepType } from './const';

// 引入logo图片
import logoImg from '@/assest/image/logo.png';

import pageStyle from './index.module.less'

const userStore = useUserStore()
const isMiniProgramEnv = isMiniProgram();

const isWeb = getIsWeb();

// 使用 Taro 导航替代 vue-router

const activeTab = ref(isWeb ? 'phone' : 'wxQrCode');
const loginMainStep = ref(ELoginMainStepType.login);
const wxLoginNextData = ref<IWxLoginBindPhoneData | null>(null);

const handleWxLoginBindPhone = (data: IWxLoginBindPhoneData) => {
  wxLoginNextData.value = data;
  loginMainStep.value = ELoginMainStepType.bindPhone;
};

onMounted(()=>{
  const env = Taro.getEnv();
  if (env != Taro.ENV_TYPE.WEB)
    Taro.setTopBarText({
      text: '登录',
    })
})

const changeActiveTab = (activeTabVal: string) => {
  if (isWeb && activeTabVal === 'wxQrCode') {
    Taro.showToast({
      title: '功能暂未开放，敬请期待~',
      icon: 'none'
    });
    return;
  }
  activeTab.value = activeTabVal;
}

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})

</script>
