import type { useRequestInterceptorsCallback } from "./type";
import { getCookie } from "@/util/cookie";
import {handle401ToLogin} from "@/lib/router/config";

export const useRequestAuth: useRequestInterceptorsCallback = (axios) => {
  // 请求拦截器
  axios.interceptors.request.use(
    (config) => {
      const cookie = getCookie();
      if (cookie) {
        // 添加 Cookie 到请求头
        config.headers.Cookie = cookie.replace(/,/g, ";");
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 处理401未授权错误
      if (error.response?.status === 401) {
        handle401ToLogin();
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
  );
};
