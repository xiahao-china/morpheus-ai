// 导航项配置
export const navItems = [
  // {
  //   key: "home",
  //   label: "首页",
  //   path: "/pages/home/index",
  //   icon: "shouye",
  // },
  {
    key: "square",
    label: "广场",
    path: "/pages/Square/index",
    icon: "guangchang",
  },
  {
    key: "draw",
    label: "绘图",
    path: "/pages/DrawingV2/index",
    icon: "pen",
  },
  // {
  //   key: "edit",
  //   label: "AI改图",
  //   path: "/pages/CarefullyReviseTheImage/index",
  // },
  {
    key: "fengshui",
    label: "风水",
    path: "/pages/Fengshui/index",
    icon: "sparkles",
  },
  {
    key: "profile",
    label: "我的",
    path: "/pages/PersonalSpace/index",
    icon: "user",
  },
];

export type NavItem = (typeof navItems)[0];
