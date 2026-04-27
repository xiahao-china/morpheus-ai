import Taro from "@tarojs/taro";

export const APP_NAME = '暖界AI';

export const API_URL = (()=>{
  const env = Taro.getEnv();
  let url = '';
  if (env === Taro.ENV_TYPE.WEB) {
    url = location.origin + '/api/v1';
  } else {
    // 小程序环境下，必须使用完整的域名路径，根据环境区分开发/测试域名
    url = process.env.NODE_ENV === 'development'
      ? 'https://dev.libuli.top/api/v1'
      : 'https://libuli.top/api/v1';
  }
  return url.trim();
})()

export const STATIC_ASSETS_URL = process.env.NODE_ENV === 'development'
  ? 'https://dev.libuli.top/wxmini'
  : 'https://libuli.top/wxmini';

export const DOMAIN = /https:\/\/(dev\.)?libuli\.top/;

export const ACTIVE_COLOR = '#2D5CF2'


