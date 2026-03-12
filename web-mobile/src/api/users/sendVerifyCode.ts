import { httpPost } from '@/lib/request/http'



export const sendVerifyCode = async (phone: string) => {
  return httpPost<object,object>('/sms/send/login/code', {phone});
}
