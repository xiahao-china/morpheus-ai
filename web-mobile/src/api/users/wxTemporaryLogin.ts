import { httpPostWithHeaders } from "@/lib/request/http";

interface LoginRequest {
  code: number;
}

export interface IWxTemporaryLoginResponse {
  isPhone: boolean;
  role: string;
  userId: number;
  username: string;
}


export const wxTemporaryLogin = async (params: LoginRequest) => {
  return httpPostWithHeaders<LoginRequest, IWxTemporaryLoginResponse>('/users/wechat/mini/login', params)
}
