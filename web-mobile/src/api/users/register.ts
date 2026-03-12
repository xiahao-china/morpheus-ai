import { httpPost } from "@/lib/request/http";

export interface IRegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
}

export interface IRegisterResponse {
  id: number;
  username: string;
  token: string;
  role: string;
}

export const registerApi = async (params: IRegisterRequest) => {
  return httpPost<IRegisterRequest, IRegisterResponse>('/users/register', params)
}
