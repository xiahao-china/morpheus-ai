import {  httpPut, httpPost } from '@/lib/request/http';


export interface IUpdateUserPasswordProps {
  oldPassword: string;
  newPassword: string;
}

export interface IFirstUpdateUserPasswordProps {
  password: string;
}


export const updateUserPassword = async (params: IUpdateUserPasswordProps) => {
  return httpPut<IUpdateUserPasswordProps,object>('/users/me/password', params);
}

export const firstUpdateUserPassword = async (params: IFirstUpdateUserPasswordProps) => {
  return httpPost<IFirstUpdateUserPasswordProps,object>('/users/me/setting/password', params);
}
