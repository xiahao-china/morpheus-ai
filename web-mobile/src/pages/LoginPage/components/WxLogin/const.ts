// 轮询间隔时间，单位为毫秒

export const POLLING_INTERVAL = 3000;

export interface IWxLoginBindPhoneData {
  code: string;
  state: string;
}

export interface IGetphonenumberData{
  detail: {
    encryptedData: string;
    iv: string;
    code: string;
  }
}
