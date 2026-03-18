import { httpPut } from "@/lib/request/http";
import type { getUserInfoResponse } from "./getUserInfo";

export interface IUpdateUserInfoParams {
  nickname?: string;
  avatar?: string;
  personalSignature?: string;
}

export const updateUserInfo = async (params: IUpdateUserInfoParams) => {
  return httpPut<object, getUserInfoResponse>("/user/info", params);
};
