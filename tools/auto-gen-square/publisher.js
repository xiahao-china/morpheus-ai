/**
 * 发布到广场逻辑
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
 * 发布图片到广场
 * @param {string} imageId - 图片 ID
 * @param {string} title - 标题
 * @param {string} caption - 描述
 * @returns {Promise<{squareId: number}>}
 */
async function publishToSquare(imageId, title, caption) {
  const url = `${config.server.baseUrl}/api/v1/square/publish`;
  const startTime = Date.now();

  const requestBody = {
    imageId,
    title: title || config.square.defaultTitle,
    caption: caption || config.square.defaultCaption,
  };

  logger.info(`[Publish] =================== 开始发布到广场 ===================`);
  logger.info(`[Publish] imageId: ${imageId}`);
  logger.info(`[Publish] title: ${requestBody.title}`);
  logger.info(`[Publish] caption: ${requestBody.caption}`);
  logger.debug(`[Publish] 请求 URL: ${url}`);
  logger.debug(`[Publish] 请求体:`, JSON.stringify(requestBody));

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    logger.debug(`[Publish] 响应状态: ${response.status}, 数据:`, JSON.stringify(response.data).substring(0, 200));

    if (response.data.code !== 200 && response.data.code !== 0) {
      logger.error(`[Publish] 失败 - code: ${response.data.code}, msg: ${response.data.msg}`);
      throw new Error(`Publish failed: ${response.data.msg || 'Unknown error'}`);
    }

    const elapsed = Date.now() - startTime;
    const squareId = response.data.data?.squareId || response.data.data?.id;
    logger.info(`[Publish] =================== 发布成功 ===================`);
    logger.info(`[Publish] squareId: ${squareId}, 耗时: ${elapsed}ms`);

    const result = response.data.data;
    return {
      squareId: result?.squareId || result?.id || result,
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`[Publish] 异常: ${error.message}, 耗时: ${elapsed}ms`);
    if (error.response) {
      logger.error(`[Publish] 响应: ${error.response.status}`, error.response.data);
    }
    throw error;
  }
}

module.exports = {
  publishToSquare,
  logger,
};