import { httpGet } from "@/lib/request/http";

interface IWxLoginResponse {
  appid: string;
  redirectUri?: string;
  responseType?: string;
  scope?: string;
  state?: string;
}

// 获取qrcode
export const wxLoginQrCode = async () => {
  return httpGet<object, IWxLoginResponse>('/users/wechat/login/qrcode', {})
}

// 轮询
export const checkWxLoginRes = async (code: string, state: string) => {
  return httpGet<object, IWxLoginResponse>('/users/wechat/callback', {
    code,
    state,
  })
}
