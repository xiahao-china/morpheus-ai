import { httpPostWithHeaders} from "@/lib/request/http";

interface IWxLoginResponse {
  appid: string;
  redirectUri?: string;
  responseType?: string;
  scope?: string;
  state?: string;
}

export interface IWxMiniProgramLoginProps {
  code: string;
  encryptedData: string;
  iv: string;
  userId: string;
}


// 轮询
export const wxMiniProgramLogin = async (params: IWxMiniProgramLoginProps) => {
  return httpPostWithHeaders<object, IWxLoginResponse>('/users/wechat/mini/bind-phone', params)
}
