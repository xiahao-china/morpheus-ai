import type { useResponseInterceptorsCallback } from "./type";
import { isAxiosError } from "axios";

export const useResponseExpire: useResponseInterceptorsCallback = (axios) => {
  axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
      if(isAxiosError(error)){
        // 登录过期错误
        if(error.response?.status===403){
          //TODO： 处理登录过期逻辑
        }
      }
      return Promise.reject(error);
    }
  );
};
