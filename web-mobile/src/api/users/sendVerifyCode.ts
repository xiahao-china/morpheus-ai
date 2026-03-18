import { httpPost } from '@/lib/request/http'



export const sendVerifyCode = async (phone: string) => {
  return httpPost<object,object>('/user/send-code', {
    type: 'phone',
    target: phone
  });
}
