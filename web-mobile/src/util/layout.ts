import Taro from "@tarojs/taro";

/**
 * 获取小程序顶部导航栏（Tab）的高度
 * 包含状态栏高度 + 胶囊按钮区域高度
 */
export const getNavbarHeight = (): number => {
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEB) {
    // Web 环境下，NavBar 组件的高度大约为 132px (对应 264rpx)
    // 根据 NavBar/index.module.less: .navigation-bar { height: 264rpx; }
    return 132;
  }

  try {
    const systemInfo = Taro.getSystemInfoSync();
    const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();

    // 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 0;

    // 导航栏高度 = (胶囊按钮.top - 状态栏高度) * 2 + 胶囊按钮.height
    // 最终总高度 = 状态栏高度 + 导航栏高度
    const navbarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height + statusBarHeight;

    return navbarHeight;
  } catch (error) {
    console.error("获取导航栏高度失败", error);
    // 降级处理：状态栏一般 20-44px，导航栏一般 44-48px，合计约 80-90px
    return 88;
  }
};

/**
 * 获取屏幕可用区域的整体高度（windowHeight）
 */
export const getWindowHeight = (): number => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    return systemInfo.windowHeight;
  } catch (error) {
    console.error("获取窗口高度失败", error);
    return 0;
  }
};

/**
 * 获取屏幕总高度（screenHeight）
 */
export const getScreenHeight = (): number => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    return systemInfo.screenHeight;
  } catch (error) {
    console.error("获取屏幕高度失败", error);
    return 0;
  }
};

/**
 * 计算剩余区域高度
 * @param extraExclusionHeight 额外需要减去的高度 (单位: px)
 * @returns 剩余高度 = 窗口总高度 - 顶部导航栏高度 - 额外排除高度
 */
export const getRemainingHeight = (extraExclusionHeight: number = 0): number => {
  const windowHeight = getWindowHeight();
  const navbarHeight = getNavbarHeight();

  return windowHeight - navbarHeight - extraExclusionHeight;
};
