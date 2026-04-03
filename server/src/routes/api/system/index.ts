import Router from "koa-router";
import { 
  getSystemTags, 
  getBaseModels, 
  getStyleModels, 
  getScenceChildrenList 
} from "@/controllers/system";

/**
 * 系统配置相关路由
 */
export default (router: Router) => {
  // 获取系统配置标签（公开接口）
  router.get('/api/system/config/tags', getSystemTags);
  // 获取基础模型列表
  router.get('/api/system/config/base', getBaseModels);
  // 获取风格模型列表
  router.get('/api/system/config/style', getStyleModels);
  // 获取菜单/场景子列表
  router.get('/api/system/config/menus', getScenceChildrenList);
}
