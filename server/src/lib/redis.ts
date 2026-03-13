/**
 * Redis 客户端模块
 * 使用 ioredis 连接 Redis 数据库
 */
import Redis from "ioredis";
import { logger } from "./log4js";
import { REDIS_CONFIG } from "@/config/index";

/**
 * Redis 客户端实例
 * 从配置文件中读取连接参数，自动处理连接和错误事件
 *
 * 使用方法：
 * @example
 * import { redis } from '@/lib/redis';
 * await redis.get('key');
 * await redis.set('key', 'value');
 */
export const redis = new Redis(REDIS_CONFIG);

// 监听连接成功事件
redis.on("connect", () => {
  logger.info("********** Redis Connected **********");
});

// 监听错误事件
redis.on("error", (err) => {
  logger.error("********** Redis Error **********\n" + err);
});

// 导出默认实例
export default redis;