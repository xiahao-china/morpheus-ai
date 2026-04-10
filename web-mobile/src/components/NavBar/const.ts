import Taro from '@tarojs/taro'
import { ROUTER_INFO } from "@/lib/router/config"
import appLogoImg from "@/assest/image/white_logo.png"
import appNameImg from "@/assest/image/white_title.png"

// NavigationBar组件的Props接口定义
export interface NavigationBarProps {
  showLogoAndTitle?: boolean  // 是否展示logo及app名称
  backgroundColor?: string    // 背景色配置
}

// NavigationBar组件的默认Props
export const defaultNavigationBarProps: Required<NavigationBarProps> = {
  showLogoAndTitle: true,
  backgroundColor: ''
}

// 静态资源路径
export const NAVIGATION_ASSETS = {
  appLogoImg,
  appNameImg
} as const

// 获取当前页面配置的静态方法
export const getCurrentPageConfig = () => {
  const currentRoute = Taro.getCurrentInstance()?.router?.path || ''
  return {
    config: ROUTER_INFO[currentRoute] || {},
    route: currentRoute
  }
}

// 获取当前页面名称的静态方法
export const getCurrentPageName = () => {
  const pageConfig = getCurrentPageConfig()
  return pageConfig?.config?.pageName || '暖界AI'
}

// 计算自定义背景样式的静态方法
export const getCustomBackground = (backgroundColor: string) => {
  return backgroundColor || '' // 如果没有自定义背景色，返回空字符串使用默认样式
}

// 判断是否应该显示logo和标题的静态方法
export const shouldShowLogoAndTitle = (showLogoAndTitle: boolean) => {
  return showLogoAndTitle
}

// 判断是否应该显示页面名称的静态方法
export const shouldShowPageName = (showLogoAndTitle: boolean) => {
  return !showLogoAndTitle
}
