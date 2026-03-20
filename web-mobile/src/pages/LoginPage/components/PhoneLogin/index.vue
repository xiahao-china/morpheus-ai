<template>
  <view :class="pageStyle['phone-login']" @keyup.enter="handlePhoneLogin">
    <view :class="pageStyle['form-item']">
      <text :class="pageStyle['form-label']">
        手机号
      </text>
      <view :class="pageStyle['input-wrapper-shell']">
        <nut-input v-model="account" placeholder="请输入手机号" type="text" :class="pageStyle['input-wrapper']" />
      </view>
    </view>
    <view :class="pageStyle['form-item']" v-show="currentPhoneLoginType === EPhoneLoginType.verificationCode">
      <text :class="pageStyle['form-label']">
        验证码
      </text>
      <view :class="pageStyle['verify-code-shell']">
        <nut-input
          v-model="verifyCode"
          placeholder="请输入验证码"
          type="text"
          maxlength="8"
          :class="pageStyle['input-wrapper']"
        />
        <view :class="pageStyle['divider']"></view>
        <nut-button
          :disabled="countdown > 0"
          @click="handleGetCode"
          type="default"
          :class="[pageStyle['get-code-btn'], {'disabled': countdown > 0}]"
        >
          <text>{{ countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码' }}</text>
        </nut-button>
      </view>
    </view>
    <view :class="pageStyle['form-item']" v-show="currentPhoneLoginType === EPhoneLoginType.password">
      <text :class="pageStyle['form-label']">
        密码
      </text>
      <nut-input
        v-model="password"
        placeholder="请输入密码"
        type="password"
        @blur="handlePasswordInput"
        :class="pageStyle['input-wrapper']"
      />
      <view v-if="passwordChechResult" :class="pageStyle['password-check-result']">
        <text>{{passwordChechResult}}</text>
      </view>
    </view>
    <view :class="pageStyle['login-auxiliary']">

      <view :class="pageStyle['login-switch']" v-if="!isBindPhone">
        <Refresh :class="pageStyle['refresh-icon']" />
        <view @click="changeLoginType" :class="pageStyle['active']">
          使用{{currentPhoneLoginType === EPhoneLoginType.verificationCode ? '密码' : '验证码'}}登录
        </view>
      </view>
    </view>
    <nut-button
      @click="()=>{
        currentPhoneLoginType === EPhoneLoginType.verificationCode ?
        handleVerifyCodeLogin() : handlePhoneLogin()
      }"
      type="primary"
      :class="pageStyle['login-btn']"
    >
      <text>{{isBindPhone ? '确认绑定' : '登录'}}</text>
    </nut-button>
    <LoginAgreement ref="agreementRef" />
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Taro from '@tarojs/taro'
import { login } from '@/api/users/login'
import { useUserStore } from '@/store'
import { Refresh } from '@nutui/icons-vue-taro';

import { sendVerifyCode } from '@/api/users/sendVerifyCode'
import { verifyCodeLogin } from '@/api/users/verifyCodeLogin';

import { EPhoneLoginType, setLoginPhone, type IPhoneLoginParams, getPasswordCheckResult } from './const';
import { verifyBindPhone } from '@/api/users/bindPhone';

import pageStyle from './index.module.less'
import {checkBackPath} from "@/pages/LoginPage/const";
import LoginAgreement from '../LoginAgreement/index.vue'
import { ensureAgreementBefore } from '../LoginAgreement/const'
import {saveCookie} from "@/util/cookie";

const props = withDefaults(defineProps<IPhoneLoginParams>(), {
  isBindPhone: false,
})
const userStore = useUserStore()

const account = ref('')
const password = ref('')
const verifyCode = ref('') // 验证码输入框
const countdown = ref(0) // 倒计时秒数
const currentPhoneLoginType = ref<EPhoneLoginType>(EPhoneLoginType.verificationCode);
const passwordChechResult = ref('');
const agreementRef = ref<any>(null)

const handlePhoneLogin = async () => {
  if (!ensureAgreementBefore(agreementRef.value, handlePhoneLogin)) return
  if (!account.value || !password.value) {
    Taro.showToast({
      title: '请填写完整信息',
      icon: 'error'
    })
    return
  }
  if (passwordChechResult.value) {
    Taro.showToast({
      title: passwordChechResult.value,
      icon: 'error'
    })
    return
  }
  setLoginPhone(account.value);
  const response = await login({ phone: account.value, password: password.value })
  if (response instanceof Error) {
    return
  }
  // 检查响应头中是否有 set-cookie
  const setCookieHeader =
    response.headers["set-cookie"] || response.headers["Set-Cookie"];
  if (setCookieHeader) {
    // 保存 Cookie 到本地存储
    saveCookie(setCookieHeader.replace(/,/g, ";"));
  }
  await userStore.initLoginInfo();
  Taro.showToast({
    title: '登录成功',
    icon: 'success'
  })
  checkBackPath('/pages/DrawingV2/index');
}

// 获取验证码
const handleGetCode = async () => {
  if (countdown.value > 0) {
    Taro.showToast({
      title: '您获取的太频繁啦，请稍后再来获取吧~',
      icon: 'error'
    })
    return
  }
  // 手机号验证
  if (!/^1[3-9]\d{9}$/.test(account.value)) {
    Taro.showToast({
      title: '请输入有效的手机号',
      icon: 'error'
    })
    return
  }

  setLoginPhone(account.value);
  // 调用发送验证码API
  const res = await sendVerifyCode(account.value)
  if (res instanceof Error || res.code !== 200) {
    console.log(res)
    return
  }

  // 开始倒计时
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)

  Taro.showToast({
    title: '验证码发送成功',
    icon: 'success'
  })
}

// 验证码登录处理
const handleVerifyCodeLogin = async () => {
  if (!ensureAgreementBefore(agreementRef.value, handleVerifyCodeLogin)) return
  if (!account.value || !verifyCode.value) {
    Taro.showToast({
      title: '请填写手机号和验证码',
      icon: 'error'
    })
    return
  }
  setLoginPhone(account.value);
  if (props.isBindPhone) {
    const res = await verifyBindPhone({
      phone: account.value,
      code: verifyCode.value
    })

    if (res instanceof Error || res.code !== 200) {
      return
    }
    Taro.showToast({
      title: '绑定成功',
      icon: 'success'
    })
    await userStore.initLoginInfo();
    checkBackPath('/pages/DrawingV2/index');
    return;
  }
  // 这里需要替换为实际的验证码登录API
  const response = await verifyCodeLogin({
    phone: account.value,
    code: verifyCode.value
  })

  if (response instanceof Error || response.data.code !== 200)
    return;

  const setCookieHeader =
    response.headers["set-cookie"] || response.headers["Set-Cookie"];
  if (setCookieHeader) {
    // 保存 Cookie 到本地存储
    saveCookie(setCookieHeader.replace(/,/g, ";"));
  }

  await userStore.initLoginInfo();
  Taro.showToast({
    title: '登录成功',
    icon: 'success'
  })
  checkBackPath('/pages/DrawingV2/index');
}

const changeLoginType = () => {
  currentPhoneLoginType.value =
    currentPhoneLoginType.value === EPhoneLoginType.verificationCode ?
      EPhoneLoginType.password : EPhoneLoginType.verificationCode;
}

const handlePasswordInput = () => {
  passwordChechResult.value = getPasswordCheckResult(password.value);
}

</script>

<style scoped lang="less">
//@import "./index.less";
:deep(.nut-input){
  padding: 0;
  border-bottom: none;
  background: transparent;
}
</style>
