import Taro from "@tarojs/taro";

export enum ELoginMainStepType {
  login = 'login',
  bindPhone = 'bindPhone',
}

export const checkBackPath = (defaultPath: string) => {
  try {
    const query = Taro.getCurrentInstance()?.router?.params || {};
    const backpath = query.backpath;
    if (backpath) {
      delete query.backpath
      const queryStr = Object.keys(query).length ? `?${Object.keys(query).map(key => `${key}=${query[key]}`).join('&')}` : '';
      Taro.redirectTo({ url: `${backpath}${queryStr}` });
      return
    }
  } catch (error) {
    console.error('checkBackPath error', error)
  }
  Taro.redirectTo({ url: defaultPath });
}
