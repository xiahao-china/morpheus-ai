// 轮询间隔时间，单位为毫秒
import {IObject} from "@/constants/types";
import Taro from "@tarojs/taro";
import {wxTemporaryLogin} from "@/api/users/wxTemporaryLogin";
import {saveCookie} from "@/util/cookie";
import {useUserStore} from "@/store";
import {once} from "@/constants/util";

export const POLLING_INTERVAL = 3000;

export interface IWxLoginBindPhoneData {
  code: string;
  state: string;
}

export interface IGetphonenumberData{
  detail: {
    encryptedData: string;
    iv: string;
    code: string;
  }
}


export const getTemporaryLoginInfo = async () => {
  const userStore = useUserStore();

  const loginRes: IObject = await new Promise((resolve, reject) => {
    Taro.login({
      success: (res) =>  resolve(res),
      fail: (err) => reject(err)
    })
  });
  const code = loginRes.code || '';

  const response = await wxTemporaryLogin({
    code,
  })
  if (response instanceof Error || response.data.code !== 200) {
    console.error(response);
    return;
  }
  if (response.data?.data?.isPhone) {
    const setCookieHeader =
      response.headers["set-cookie"] || response.headers["Set-Cookie"];
    if (setCookieHeader) {
      // 保存 Cookie 到本地存储
      saveCookie(setCookieHeader.replace(/,/g, ";"));
    }
    await userStore.initLoginInfo();
    return;
  }
  userStore.setUserInfo({
    id: response.data.data.userId || '',
    name: response.data.data.username || '',
    avatar: '',
    isLogin: false,
    isPhone: response.data.data.isPhone || false,
  })
}

export const onceGetTemporaryLoginInfo = once(getTemporaryLoginInfo);

