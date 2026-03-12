import { httpGet } from '@/lib/request/http';

export const getWxGroupQrCodeImg = async () => {
  return httpGet<null, string>('/system/config/qrcode', null);
};
