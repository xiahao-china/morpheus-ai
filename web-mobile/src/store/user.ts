import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Toast } from '@nutui/nutui-taro';
import {getUserInfo as getUserInfoApi} from '@/api/users/getUserInfo'
import * as Sentry from '@sentry/vue'
import Taro from "@tarojs/taro";
import { makeUrlAbsolute } from '@/util/url';

// 用户信息接口定义
export interface UserInfo {
  id: string | number
  name: string
  avatar: string
  isLogin: boolean
  isPhone?: boolean;
  nickname?: string;
  personalSignature?: string;
  points?: number;
}

const testStorageCanUse = () => {
  try {
    Taro.getStorageSync('');
    if (!document.cookie) {
      document.cookie = 'test'
      if (!document.cookie) {
        new Error('Cookie is disabled');
      }
    }
  }catch (err){
    console.log(err);
    Toast.fail('您的浏览器未开启Cookie，请在设置中启用！', {
      duration: 60*1000,
    })
  }
  return true;
}

// 定义用户 store
export const useUserStore = defineStore('user', () => {
  // 用户基本信息
  const id = ref<string | number>('')
  const name = ref<string>('')
  const avatar = ref<string>('')
  const isLogin = ref<boolean>(false);
  const isPhone = ref<boolean>(false);
  const nickname = ref<string>('');
  const personalSignature = ref<string>('');
  const points = ref<number>(0);

  const hasInitLoginInfo = ref<boolean>(false);

  // 是否已登录
  const initLoginInfo = async () => {
    const checkRes = testStorageCanUse();
    if (!checkRes) return ;
    const response = await getUserInfoApi();
    if (response instanceof Error || response.code !== 200) {
      console.info(response);
      hasInitLoginInfo.value = true;
      return false;
    }

    const { _id, username, avatar: avatarPath, phone, nickname: nick, personalSignature: sig, points: pts } = response.data;
    setUserInfo({
      id: _id,
      name: username,
      avatar: makeUrlAbsolute(avatarPath || ''),
      isLogin: Boolean(username),
      isPhone: Boolean(phone),
      nickname: nick,
      personalSignature: sig,
      points: pts,
    })
    hasInitLoginInfo.value = true;
    return true;
  }

  // 设置用户信息
  const setUserInfo = (userInfo: UserInfo) => {
    Sentry.setUser({
      id: userInfo.id,
      username: userInfo.name,
      avatar: userInfo.avatar,
    })
    id.value = userInfo.id
    name.value = userInfo.name
    avatar.value = userInfo.avatar
    isLogin.value = userInfo.isLogin
    isPhone.value = userInfo.isPhone || false;
    nickname.value = userInfo.nickname || '';
    personalSignature.value = userInfo.personalSignature || '';
    points.value = userInfo.points || 0;
  }

  // 清除用户信息
  const clearUserInfo = () => {
    id.value = ''
    name.value = ''
    avatar.value = ''
    isLogin.value = false;
    isPhone.value = false;
    nickname.value = '';
    personalSignature.value = '';
    points.value = 0;
  }

  // 获取用户信息
  const getUserInfo = (): UserInfo => {
    return {
      id: id.value,
      name: name.value,
      avatar: avatar.value,
      isLogin: isLogin.value,
      isPhone: isPhone.value,
      nickname: nickname.value,
      personalSignature: personalSignature.value,
      points: points.value,
    }
  }

  return {
    // 状态
    id,
    name,
    avatar,
    isLogin,
    hasInitLoginInfo,
    isPhone,
    nickname,
    personalSignature,
    points,

    // 方法
    setUserInfo,
    clearUserInfo,
    getUserInfo,
    initLoginInfo
  }
})
