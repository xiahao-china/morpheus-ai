export const appConfig = {
  pages: [
    "pages/Square/index", // 广场页
    "pages/PersonalSpace/index", // 我的空间
    "pages/LoginPage/index", // 登录页
    "pages/home/index", // 首页
    "pages/Drawing/index",
  ],
  subPackages: [
    {
      root: "packageSettings",
      pages: [
        "pages/EditProfile/index",
        "pages/PrivacyPolicy/index",
        "pages/ServiceAgreement/index",
      ],
    },
    {
      root: "packageHistory",
      pages: [
        "pages/HistoryDetailPage/index",
        "pages/GeneratedDetail/index",
        "pages/History/index",
      ],
    },
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
    navigationStyle: "custom",
  },
};

export default appConfig;
