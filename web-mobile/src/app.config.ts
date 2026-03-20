export const appConfig = {
  pages: [
    "pages/Square/index", // 广场页
    "pages/MySpace/index", // 我的空间
    "pages/PersonalSpace/index", // 我的空间
    "pages/LoginPage/index", // 登录页
    "pages/DrawingV2/index",
    "pages/Fengshui/index", // 风水页
    "pages/Fengshui/Progress/index", // 风水进度页
    "pages/Fengshui/Report/index", // 风水报告页
    "pages/Fengshui/History/index", // 风水历史页
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
