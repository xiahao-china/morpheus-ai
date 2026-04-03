import type { useRequestInterceptorsCallback } from "./type";
import { getCookie } from "@/util/cookie";
import {handle401ToLogin} from "@/lib/router/config";

export const useRequestAuth: useRequestInterceptorsCallback = (axios) => {
  // 请求拦截器
  axios.interceptors.request.use(
    (config) => {
      const cookie = getCookie();
      if (cookie) {
        // 1. 添加 Cookie 到请求头 (兼容旧逻辑)
        config.headers.Cookie = cookie.replace(/,/g, ";");

        // 2. 尝试提取 token 并添加 Authorization Bearer 头
        // 匹配 token=xxxxx; 或者 token=xxxxx 结尾
        const tokenMatch = cookie.match(/token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1].trim();
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[Auth Interceptor] Added Authorization header');
        }
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
      if (error.response?.status === 401 || error.data?.code === 401) {
        handle401ToLogin();
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
  );
};
