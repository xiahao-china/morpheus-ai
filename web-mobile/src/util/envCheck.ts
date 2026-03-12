// 判断是否小程序环境
import {IObject} from "@/constants/types";
import Taro from "@tarojs/taro";

export const isMiniProgram = (): boolean => {
  return /miniprogram/i.test(navigator.userAgent) || Boolean((window as IObject).__wxConfig);
}

export const getIsWeb = (): boolean => {
  const env = (Taro as any).getEnv ? (Taro as any).getEnv() : 'WEAPP'
  return env === 'WEB'
}
