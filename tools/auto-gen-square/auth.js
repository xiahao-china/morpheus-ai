/**
 * 认证校验逻辑
 */

const axios = require('axios');
const config = require('./config');

const logger = {
  debug: (...args) => config.logLevel === 'debug' && console.log('[DEBUG]', new Date().toISOString(), ...args),
  info: (...args) => (config.logLevel === 'debug' || config.logLevel === 'info') && console.log('[INFO]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
};

/**
 * 获取当前用户信息
 * @returns {Promise<{userId: string, username: string}>}
 */
async function getCurrentUser() {
  const url = `${config.server.baseUrl}${config.server.apiPrefix}/user/info`;

  logger.debug(`[Auth] 请求用户信息, URL: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
      },
      timeout: 10000,
    });

    logger.debug(`[Auth] 响应状态: ${response.status}, 数据:`, JSON.stringify(response.data).substring(0, 200));

    if (response.data.code !== 200 && response.data.code !== 0) {
      logger.error(`[Auth] 获取用户信息失败 - code: ${response.data.code}, msg: ${response.data.msg}`);
      throw new Error(`获取用户信息失败: ${response.data.msg || 'Token 无效'}`);
    }

    return response.data.data;
  } catch (error) {
    logger.error(`[Auth] 异常: ${error.message}`);
    if (error.response) {
      logger.error(`[Auth] 响应: ${error.response.status}`, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      logger.error(`[Auth] 无法连接到服务器: ${config.server.baseUrl}`);
    }
    throw error;
  }
}

/**
 * 校验 Token 是否有效
 * @returns {Promise<{userId: string, username: string}>}
 */
async function validateToken() {
  const startTime = Date.now();
  logger.info(`[Auth] 开始校验 Token...`);

  try {
    const user = await getCurrentUser();
    const elapsed = Date.now() - startTime;

    logger.info(`[Auth] Token 校验成功, 用户: ${user.username} (${user.userId}), 耗时: ${elapsed}ms`);
    logger.info(`[Auth] 用户角色: ${user.role}, 手机号: ${user.phone || '未绑定'}`);

    return user;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`[Auth] Token 校验失败, 耗时: ${elapsed}ms, 错误: ${error.message}`);
    throw error;
  }
}

/**
 * 初始化认证
 * 1. 检查配置中是否有 token
 * 2. 校验 token 是否有效
 * @returns {Promise<{userId: string, username: string}>}
 */
async function initAuth() {
  // 1. 检查 token 是否存在
  if (!config.auth.token) {
    logger.error(`[Auth] 配置文件中未设置 auth.token`);
    throw new Error('配置文件中未设置 auth.token，请先在 config.js 中配置');
  }

  logger.info(`[Auth] Token 已配置: ${config.auth.token.substring(0, 20)}...`);
  logger.info(`[Auth] 服务端地址: ${config.server.baseUrl}`);

  // 2. 校验 token 是否有效
  const user = await validateToken();

  return user;
}

module.exports = {
  getCurrentUser,
  validateToken,
  initAuth,
  logger,
};