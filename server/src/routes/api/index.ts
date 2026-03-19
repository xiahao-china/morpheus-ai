import Router from "koa-router";

// 导入各个模块的路由
import userRoutes from "./user/index";           // 用户相关路由
import squareRoutes from "./square/index";       // 广场相关路由
import fileRoutes from "./file/index";           // 文件上传相关路由
import generationRoutes from "./generation/index"; // 生成任务及作品反馈路由
import membershipRoutes from "./membership/index"; // 会员套餐相关路由
import pointsRoutes from "./points/index";       // 积分相关路由
import taskRewardRoutes from "./task-reward/index"; // 任务奖励相关路由
import weixinRoutes from "./weixin/index";       // 微信登录相关路由
import paymentRoutes from "./payment/index";     // 支付相关路由

/**
 * API 路由聚合中心
 * 注册所有 API 子路由到主路由器
 */
export default (router: Router) => {
  userRoutes(router);           // 用户模块
  squareRoutes(router);         // 广场模块
  fileRoutes(router);           // 文件模块
  generationRoutes(router);     // 生成任务模块
  membershipRoutes(router);     // 会员模块
  pointsRoutes(router);         // 积分模块
  taskRewardRoutes(router);     // 任务奖励模块
  weixinRoutes(router);         // 微信登录模块
  paymentRoutes(router);        // 支付模块
}
