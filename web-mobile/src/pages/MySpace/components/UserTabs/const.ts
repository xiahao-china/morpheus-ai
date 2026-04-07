import { EDrawingType } from "@/api/generate/workStream";

/**
 * 用户标签页类型枚举
 */
export enum ETabType {
  History = "history", // 历史记录标签页
  SquareCollection = "squareCollection", // 广场收藏标签页
}

/**
 * 标签页信息接口
 */
export interface ITabInfo {
  id: string; // 标签页ID
  name: string; // 标签页名称
  disabled?: boolean; // 是否禁用
}

/**
 * 标签页配置数组
 */
export const TABS: ITabInfo[] = [
  {
    id: ETabType.History,
    name: "我的历史",
    disabled: false,
  },
  {
    id: ETabType.SquareCollection,
    name: "广场收藏",
  },
];

/**
 * 筛选选项接口
 */
export interface IFilterOption {
  label: string; // 显示文本
  value: string; // 筛选值
}

/**
 * 历史记录筛选选项
 */
export const FILTER_OPTIONS: IFilterOption[] = [
  { label: "全部", value: "" },
];

/**
 * 支持查看详情的图片类型
 */
export const SUPPORTED_TYPES = [
  EDrawingType.INSPIRATION,
  EDrawingType.LINEAR_RENDER,
  EDrawingType.RENDER_LY,
  EDrawingType.MAKE_UP,
  EDrawingType.REHABILITATION,
];

/**
 * 分页相关常量
 */
export const PAGE_SIZE = 10; // 每页加载数量

/**
 * 滚动显示返回顶部按钮的阈值
 */
export const SCROLL_THRESHOLD = 300;
