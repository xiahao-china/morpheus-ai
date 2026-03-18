import Taro from "@tarojs/taro";

export const APP_NAME = '暖界AI';

// export const API_URL = process.env.NODE_ENV === 'development' ? 'http://113.108.105.54:8187/v1/api' : 'http://113.108.105.54:8187/v1/api';
// export const API_URL = process.env.NODE_ENV === 'development' ? `https://dev8186.tuiqiao.art/api/v1`
//   : `${location.protocol}//${location.host}/api/v1`;

export const API_URL = (()=>{
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEB) {
    return location.origin + '/api/v1';
  }
  // return `https://dev8186.tuiqiao.art/api/v1`;
  return `https://tuiqiao.art/api/v1`;
})()

export const STATIC_ASSETS_URL = process.env.NODE_ENV === 'development' ? 'https://dev8186.tuiqiao.art/wxmini' : 'https://dev8186.tuiqiao.art/wxmini';

export const DOMAIN = /https:\/\/tuiqiao.art/;

export const ACTIVE_COLOR = '#2D5CF2'


