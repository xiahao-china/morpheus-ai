import Taro from '@tarojs/taro'
import { ROUTER_INFO } from "@/lib/router/config"

// Layout组件的Props接口定义
export interface LayoutProps {
  navBackgroundColor?: string
}

// Layout组件的默认Props
export const defaultLayoutProps: Required<LayoutProps> = {
  navBackgroundColor: ''
}

// 获取当前页面配置的静态方法
export const getCurrentPageConfig = () => {

  let currentRoute = Taro.getCurrentInstance()?.router?.path || '';
  currentRoute = currentRoute.split('?')[0];
  return {
    config: ROUTER_INFO[currentRoute],
    route: currentRoute,
  }
}

// 判断是否需要显示NavigationBar的静态方法
export const shouldShowNavigationBar = (pageConfig: any) => {
  return pageConfig.needNavBar !== false
}

// 判断是否需要显示BottomNavigation的静态方法
export const shouldShowBottomNavigation = (pageConfig: any) => {
  return pageConfig.needBottomBar === true
}

// 获取NavigationBar logo显示状态的静态方法
export const getLogoVisibility = (pageConfig: any, propsShowLogo: boolean) => {
  // 如果配置中明确需要显示导航栏，则根据props控制logo显示
  if (pageConfig.needNavBar === true) {
    return propsShowLogo
  }
  // 默认显示logo
  return propsShowLogo
}

// 获取NavigationBar标题显示状态的静态方法
export const getTitleVisibility = (pageConfig: any, propsShowTitle: boolean) => {
  // 如果配置中明确需要显示导航栏，则根据props控制标题显示
  if (pageConfig.needNavBar === true) {
    return propsShowTitle
  }
  // 默认显示标题
  return propsShowTitle
}

// 获取NavigationBar背景色的静态方法
export const getNavigationBarBackgroundColor = (backgroundColor: string) => {
  return backgroundColor
}
