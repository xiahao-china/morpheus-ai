import Taro from '@tarojs/taro';

/**
 * Cookie 存储工具类
 * 用于在小程序环境中存储和管理 Cookie 信息
 */
export class CookieManager {
  private static readonly COOKIE_KEY = `${process.env.NODE_ENV === 'development' ? 'dev_' : ''}tuiqiao_app_cookie`;

  /**
   * 从响应头中解析 set-cookie 并保存到本地存储
   * @param setCookieHeader - 响应头中的 set-cookie 字符串
   */
  static saveCookieFromHeader(setCookieHeader: string): void {
    try {
      if (!setCookieHeader) {
        console.warn('Cookie header is empty');
        return;
      }
      console.log('set-cookie header:', setCookieHeader);

      // 解析 set-cookie 头，提取 cookie 值
      const cookieValue = setCookieHeader;

      if (cookieValue) {
        // 保存到本地存储
        Taro.setStorageSync(CookieManager.COOKIE_KEY, cookieValue);
        console.log('Cookie saved successfully:', cookieValue);
      }
    } catch (error) {
      console.error('Failed to save cookie:', error);
    }
  }

  /**
   * 从本地存储获取 Cookie
   * @returns Cookie 字符串或 null
   */
  static getCookie(): string | null {
    try {
      const cookie = Taro.getStorageSync(CookieManager.COOKIE_KEY) || '';
      return cookie || null;
    } catch (error) {
      console.error('Failed to get cookie:', error);
      return null;
    }
  }

  /**
   * 清除本地存储的 Cookie
   */
  static clearCookie(): void {
    try {
      Taro.removeStorageSync(CookieManager.COOKIE_KEY);
      console.log('Cookie cleared successfully');
    } catch (error) {
      console.error('Failed to clear cookie:', error);
    }
  }

  /**
   * 检查是否存在有效的 Cookie
   * @returns 是否存在 Cookie
   */
  static hasCookie(): boolean {
    const cookie = this.getCookie();
    return !!cookie;
  }
}

/**
 * 便捷的导出函数
 */
export const saveCookie = CookieManager.saveCookieFromHeader;
export const getCookie = CookieManager.getCookie;
export const clearCookie = CookieManager.clearCookie;
export const hasCookie = CookieManager.hasCookie;
