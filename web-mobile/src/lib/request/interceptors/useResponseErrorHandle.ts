import Taro from '@tarojs/taro'
import {IObject} from "@/constants/types";
import {handle401ToLogin} from "@/lib/router/config";
// import {reportApiStatus} from "@/api/system/config/grafana";
import type { ApiResponse } from "../http";
import type { useResponseInterceptorsCallback } from "./type";

export const useResponseErrorHandle: useResponseInterceptorsCallback = (axios) => {
  axios.interceptors.response.use(
    (response) => {
      if (response.headers['content-type'] === 'text/event-stream') return response;

      if ((response.config as { ignoreError?: boolean }).ignoreError) {
        return response;
      }
      const res = response.data as ApiResponse<unknown>;
      if ((response as IObject).statusCode === 401) {
        handle401ToLogin();
        return Promise.reject(response);
      }
      const path = response.config.url;
      if (path !== '/metrics/events' && res.code !== 200) {
        // TODO: 处理错误
        console.error('err', response);
        Taro.showToast({ title: res.msg || res.message || '请求错误', icon: 'none', duration: 2000 });
        // reportApiStatus({
        //   tags: {
        //     event_type: 'res_code',
        //   },
        //   fields: {
        //     data_code: res.code,
        //     status_code: (response as IObject).statusCode,
        //     error_message: res.msg || res.message,
        //     // 只传递基础路径，不带有参数
        //     request_url: response.config.url || '',
        //     request_method: response.config.method || '',
        //   },
        //   timestamp: Date.now() * 1e6,
        // })
      }
      return response;
    },
    (error) => {
      const url = new URL(error.config.url);
      console.log('url.toString()',url.toString());
      // reportApiStatus({
      //   tags: {
      //     event_type: 'status_code',
      //   },
      //   fields: {
      //     status_code: error.response?.status,
      //     error_message: error.message,
      //     // 只传递基础路径，不带有参数
      //     request_url: url.pathname,
      //     request_method: error.config.method,
      //   },
      //   timestamp: Date.now() * 1e6,
      // })

      // TODO: 处理错误
      if (error.response?.status === 401) {
        handle401ToLogin();
      }else {
        console.error('error',error);
        Taro.showToast({ title: error.message || '网络错误', icon: 'none', duration: 2000 });
      }
      return Promise.reject(error);
    }
  );
};
