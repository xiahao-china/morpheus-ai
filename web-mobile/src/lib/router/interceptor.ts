import Taro from "@tarojs/taro";
import {IObject} from "@/constants/types";
import { ROUTER_INFO} from "@/lib/router/config";
import {useUserStore} from "@/store";

const checkPrePath = (path: string) => {
  const userStore = useUserStore()
  const isLogin = Boolean(userStore.isPhone);
  if (isLogin) return path;
  const needCheckRouteName = Object.keys(ROUTER_INFO).filter(route => ROUTER_INFO[route].needLogin).map(route => route);
  if (needCheckRouteName.includes(path)) {
    const query = Taro.getCurrentInstance()?.router?.params || {};
    console.log('query', query);
    query.backpath = path;
    const queryStr = Object.keys(query).length ? `?${Object.keys(query).map(key => `${key}=${query[key]}`).join('&')}` : '';
    return `/pages/LoginPage/index${queryStr}`;
  }
  return path;
}

(Taro as IObject).originNnavigateTo = Taro.navigateTo;
Taro.navigateTo = (obj:IObject)=>{
  console.log(obj);
  return (Taro as IObject).originNnavigateTo({
    ...obj,
    url: checkPrePath(obj.url || ''),
  });
}
