import Taro from "@tarojs/taro";

export const ROUTER_INFO = {
  '/pages/home/index': {
    pageName: '首页',
    needLogin: false,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/pages/Drawing/index': {
    pageName: '推敲绘图',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/pages/app/index': {
    pageName: 'AI绘图',
    needLogin: true,
    needNavBar: true,
    needMobileNav: false,
    needBottomBar: true
  },
  '/pages/CarefullyReviseTheImage/index': {
    pageName: 'AI改图',
    needLogin: true,
    needNavBar: true,
    needMobileNav: false,
    needBottomBar: true
  },
  '/pages/Square/index': {
    pageName: '作品广场',
    needLogin: false,
    needNavBar: true,
    needMobileNav: true,
    needBottomBar: true
  },
  '/pages/PersonalSpace/index': {
    pageName: '个人空间',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageSettings/pages/EditProfile/index': {
    pageName: '编辑资料',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/pages/LoginPage/index': {
    pageName: '登录',
    needLogin: false,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageSettings/pages/PrivacyPolicy/index': {
    pageName: '推敲AI平台隐私政策',
    needLogin: false,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageSettings/pages/ServiceAgreement/index': {
    pageName: '推敲AI平台用户服务协议',
    needLogin: false,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageHistory/pages/GeneratedDetail/index': {
    pageName: '生成详情',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageHistory/pages/History/index': {
    pageName: '创作历史',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
  '/packageHistory/pages/HistoryDetailPage/index': {
    pageName: '历史详情',
    needLogin: true,
    needNavBar: false,
    needMobileNav: false,
    needBottomBar: false
  },
}

export const handle401ToLogin = (force: boolean = false): boolean => {
  console.info("Unauthorized access - redirecting to login");
  const needCheckRouteName = Object.keys(ROUTER_INFO).filter(route => ROUTER_INFO[route].needLogin).map(route => route);
  let currentPath = Taro.getCurrentInstance()?.router?.path || '';
  currentPath = currentPath.split('?')[0];
  // 避免在已经在登录页面时重复跳转
  if (force || needCheckRouteName.includes(currentPath)) {
    const query = Taro.getCurrentInstance()?.router?.params || {};
    console.log('query', query);
    query.backpath = currentPath;
    const queryStr = Object.keys(query).length ? `?${Object.keys(query).map(key => `${key}=${query[key]}`).join('&')}` : '';
    Taro.reLaunch({ url: `/pages/LoginPage/index${queryStr}` });
    return false;
  }
  return true;
}
