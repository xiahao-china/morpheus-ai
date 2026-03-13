/**
 * Log4js 日志配置模块
 * 提供统一的日志记录功能，支持控制台输出和文件输出
 */
import log4js from 'log4js';

/**
 * Log4js 配置
 * - console: 控制台输出
 * - access: 按日期滚动的文件输出，保留4天日志
 */
log4js.configure({
  appenders: {
    // 文件日志配置
    access: {
      type: 'dateFile',                // 按日期创建日志文件
      filename: 'logs/out',            // 日志文件目录
      pattern: 'yyyy-MM-dd.log',       // 文件名格式：out.2024-01-01.log
      alwaysIncludePattern: true,      // 始终包含日期格式
      layout: {
        type: 'basic'                  // 基本布局格式
      },
      numBackups: 4                    // 保留最近4天的日志文件
    },
    // 控制台日志配置
    console: {
        type: 'console'                // 输出到控制台
    }
  },
  categories: {
    // 默认分类：同时输出到控制台和文件
    default: {
      appenders: ['console', 'access'],
      level: 'info'                    // 日志级别：info及以上
    }
  }
});

/**
 * 获取指定分类的日志记录器
 * @param category - 日志分类名，默认为 'access'
 * @returns 日志记录器实例
 *
 * @example
 * const logger = getLogger("MyModule");
 * logger.info("这是一条信息日志");
 * logger.error("这是一条错误日志");
 */
export const getLogger = (category = 'access') => {
    return log4js.getLogger(category);
}

/**
 * 默认日志记录器（使用默认分类）
 */
export const logger = getLogger();