import { sendResponse } from "@/utils/const";
import { Context } from "koa";

/**
 * 获取系统配置标签列表
 * GET /api/system/config/tags
 */
export const getSystemTags = async (ctx: Context) => {
  const sceneTags = [
    { id: 1, name: "办公室", isEnabled: true },
    { id: 2, name: "大堂", isEnabled: true },
    { id: 3, name: "前台", isEnabled: true },
    { id: 4, name: "会议室", isEnabled: true },
    { id: 5, name: "公共办公室", isEnabled: true },
    { id: 6, name: "董事长办公室", isEnabled: true },
    { id: 7, name: "茶水间", isEnabled: true },
    { id: 8, name: "休息区", isEnabled: true },
    { id: 9, name: "办公走廊", isEnabled: true },
    { id: 10, name: "阳台", isEnabled: true },
    { id: 11, name: "餐厅", isEnabled: true },
    { id: 12, name: "商场中庭", isEnabled: true },
    { id: 13, name: "书店", isEnabled: true },
    { id: 14, name: "展厅", isEnabled: true },
    { id: 15, name: "厂房", isEnabled: true },
    { id: 16, name: "操作间", isEnabled: true },
    { id: 17, name: "其他", isEnabled: true }
  ];

  const styleTags = [
    { id: 101, name: "现代", isEnabled: true },
    { id: 102, name: "简约", isEnabled: true },
    { id: 103, name: "奶油", isEnabled: true },
    { id: 104, name: "法式", isEnabled: true },
    { id: 105, name: "工业", isEnabled: true },
    { id: 106, name: "轻奢", isEnabled: true },
    { id: 107, name: "中式", isEnabled: true },
    { id: 108, name: "原木", isEnabled: true },
    { id: 109, name: "复古", isEnabled: true }
  ];

  sendResponse.success(ctx, {
    sceneTags,
    styleTags
  });
};

/**
 * 获取基础模型列表
 * GET /api/system/config/base
 */
export const getBaseModels = async (ctx: Context) => {
  sendResponse.success(ctx, { 
    records: [], 
    total: 0,
    size: 10,
    current: 1,
    pages: 0
  });
};

/**
 * 获取风格模型列表
 * GET /api/system/config/style
 */
export const getStyleModels = async (ctx: Context) => {
  sendResponse.success(ctx, { 
    records: [], 
    total: 0,
    size: 10,
    current: 1,
    pages: 0
  });
};

/**
 * 获取菜单/场景子列表
 * GET /api/system/config/menus
 */
export const getScenceChildrenList = async (ctx: Context) => {
  sendResponse.success(ctx, []);
};
