import { httpGet, httpPost } from '@/lib/request/http'


export interface getUserInfoResponse {
  username: string;
  email: string;
  phone: string;
  avatar: null | string;
  role: string;
  personalSignature: null | string;
  designerIntroduction: null | string;
  isPhone?: boolean;

  nickname: null | string; // 微信用户名
  outwardId: null | string; // 用户id
  isPassword: boolean; // 是否有密码
  createdTime: string;
}


export const getUserInfo = async () => {
  return httpGet<object,getUserInfoResponse>('/users/me', {});
}
