import { httpPut } from "@/lib/request/http";

interface IGetUserInfoResponse {
  username: string;
  email?: string;
  phone?: string;
  avatar: null | string;
  personalSignature: null | string;
  designerIntroduction: null | string;
}

export const updateUserInfo = async (params: IGetUserInfoResponse) => {
  return httpPut<object, IGetUserInfoResponse>("/users/me", params);
};
