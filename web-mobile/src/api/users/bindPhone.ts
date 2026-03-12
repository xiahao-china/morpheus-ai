import { httpPost } from "@/lib/request/http";

interface IVerifyBindPhoneParams {
  phone: string;
  code: string;
}


export const verifyBindPhone = async (params: IVerifyBindPhoneParams) => {
  return httpPost<IVerifyBindPhoneParams, object>('/users/bind-phone', params)
}
