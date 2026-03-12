import Taro from "@tarojs/taro";
export const LOGIN_PHONE = 'account_phone';

export const getLoginPhone = () => {
  return Taro.getStorageSync(LOGIN_PHONE);
}

export const setLoginPhone = (phone: string) => {
  Taro.setStorageSync(LOGIN_PHONE, phone);
}

export enum EPhoneLoginType {
  // 密码
  password = 'password',
  // 验证码
  verificationCode = 'verificationCode',
}

export interface IPhoneLoginParams {
  isBindPhone?: boolean;
}

export const getPasswordCheckResult = (psw: string) => {
  if (psw.length < 8) {
    return '密码长度不能小于8位';
  }
  if (psw.length > 20) {
    return '密码长度不能大于20位';
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(psw)) {
    return '密码必须包含字母和数字';
  }
  return '';
}
