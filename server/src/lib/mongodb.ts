/**
 * MongoDB 数据库连接模块
 * 使用 Mongoose ODM 连接 MongoDB 数据库
 */
import mongoose from "mongoose";
import { logger } from "./log4js";
import { MONGO_CONFIG } from "@/config/index";

/**
 * 连接 MongoDB 数据库
 * 自动处理连接成功、错误、断开的日志记录
 *
 * 使用方法：在应用启动时调用一次即可
 * @example
 * import { connectMongoDB } from '@/lib/mongodb';
 * connectMongoDB();
 */
export const connectMongoDB = () => {
  // 建立数据库连接
  logger.info(`Connecting to MongoDB at ${MONGO_CONFIG.URL}...`);
  mongoose.connect(MONGO_CONFIG.URL);

  // 获取mongoose连接对象
  const db = mongoose.connection;

  // 连接成功
  db.on("open", () => logger.info("********** MongoDB Connected **********"));
  // 数据库打开
  db.on("connected", () => logger.info("********** MongoDB Open **********"));
  // 连接错误
  db.on("error", (err) => logger.error("********** MongoDB Error **********\n" + err));
  // 连接断开
  db.on("disconnected", () => logger.warn("********** MongoDB Disconnected **********"));
};