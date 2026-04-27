/**
 * 生图逻辑 - 参照 web-mobile 的生图 API
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
 * 创建生图任务
 * @param {string} prompt - 提示词
 * @param {object} options - 可选参数
 * @returns {Promise<{taskId: number}>}
 */
async function createGenerateTask(prompt, options = {}) {
  const { modelId, width, height, count } = { ...config.generation, ...options };
  const startTime = Date.now();

  const requestBody = {
    prompt,
    modelId,
    width,
    height,
    count: count || 1,
  };

  const url = `${config.server.baseUrl}/api/v1/image/generate`;

  logger.info(`[CreateTask] 开始创建生图任务`);
  logger.info(`[CreateTask] Prompt: ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}`);
  logger.info(`[CreateTask] 参数: modelId=${modelId}, width=${width}, height=${height}, count=${count}`);
  logger.debug(`[CreateTask] 请求 URL: ${url}`);
  logger.debug(`[CreateTask] 请求体:`, JSON.stringify(requestBody));

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.debug(`[CreateTask] 响应状态: ${response.status}, 数据:`, JSON.stringify(response.data).substring(0, 200));

    if (response.data.code !== 200 && response.data.code !== 0) {
      logger.error(`[CreateTask] 失败 - code: ${response.data.code}, msg: ${response.data.msg}`);
      throw new Error(`Create task failed: ${response.data.msg || 'Unknown error'}`);
    }

    const elapsed = Date.now() - startTime;
    const taskId = response.data.data?.taskId || response.data.data?.id || response.data.data?.task_id;
    logger.info(`[CreateTask] 成功 - taskId: ${taskId}, 响应: ${JSON.stringify(response.data.data).substring(0, 200)}, 耗时: ${elapsed}ms`);

    if (!taskId) {
      logger.error(`[CreateTask] 无法获取 taskId, 响应:`, response.data);
    }

    return response.data.data;
  } catch (error) {
    logger.error(`[CreateTask] 异常: ${error.message}`);
    if (error.response) {
      logger.error(`[CreateTask] 响应: ${error.response.status}`, error.response.data);
    }
    throw error;
  }
}

/**
 * 查询生图任务状态
 * @param {number} taskId - 任务 ID
 * @returns {Promise<{status: string, imageId?: string, imageUrl?: string}>}
 */
async function getTaskStatus(taskId) {
  const url = `${config.server.baseUrl}/api/v1/image/detail/${taskId}`;

  logger.debug(`[GetStatus] 查询任务状态: ${taskId}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
      },
      timeout: 10000,
    });

    if (response.data.code !== 200 && response.data.code !== 0) {
      logger.error(`[GetStatus] 失败 - code: ${response.data.code}, msg: ${response.data.msg}`);
      throw new Error(`Get status failed: ${response.data.msg || 'Unknown error'}`);
    }

    logger.debug(`[GetStatus] 任务 ${taskId} 状态: ${response.data.data.status}`);
    return response.data.data;
  } catch (error) {
    logger.error(`[GetStatus] 异常: ${error.message}`);
    throw error;
  }
}

/**
 * 轮询等待生图完成
 * @param {number} taskId - 任务 ID
 * @returns {Promise<{status: string, imageId?: string, imageUrl?: string}>}
 */
async function waitForCompletion(taskId) {
  const { pollInterval, maxWaitTime } = config.generation;
  const startTime = Date.now();
  let pollCount = 0;

  logger.info(`[WaitComplete] 开始轮询等待任务完成, taskId: ${taskId}, 间隔: ${pollInterval}ms, 超时: ${maxWaitTime}ms`);

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > maxWaitTime) {
      logger.error(`[WaitComplete] 任务 ${taskId} 超时, 已等待: ${elapsed}ms`);
      throw new Error(`Generation timeout, waited ${elapsed}ms`);
    }

    pollCount++;
    const status = await getTaskStatus(taskId);

    logger.debug(`[WaitComplete] 轮询 #${pollCount}, taskId: ${taskId}, status: ${status.status}, 已等待: ${elapsed}ms`);

    if (status.status === 'COMPLETED' || status.status === 'completed' || status.status === 'success') {
      const totalTime = Date.now() - startTime;
      logger.info(`[WaitComplete] 任务 ${taskId} 完成, 轮询次数: ${pollCount}, 总耗时: ${totalTime}ms`);
      logger.info(`[WaitComplete] imageId: ${status.imageId}, imageUrl: ${status.imageUrl?.substring(0, 50)}...`);
      return status;
    }

    if (status.status === 'FAILED' || status.status === 'failed' || status.status === 'error') {
      logger.error(`[WaitComplete] 任务 ${taskId} 失败, status: ${status.status}, error: ${status.errorMsg}`);
      throw new Error(`Generation failed: ${status.errorMsg || 'Unknown error'}`);
    }

    // 等待下次轮询
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

/**
 * 生成图片完整流程
 * @param {string} prompt - 提示词
 * @param {object} options - 可选参数
 * @returns {Promise<{taskId: number, imageId: string, imageUrl: string}>}
 */
async function generateImage(prompt, options = {}) {
  const overallStartTime = Date.now();

  logger.info(`[Generate] =================== 开始生成图片 ===================`);
  logger.info(`[Generate] Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);

  try {
    // 1. 创建生图任务
    const createResult = await createGenerateTask(prompt, options);
    const taskId = createResult?.taskId || createResult?.id || createResult?._id;

    if (!taskId) {
      throw new Error('无法获取 taskId');
    }

    logger.info(`[Generate] 任务已创建, taskId: ${taskId}`);

    // 2. 轮询等待完成
    const statusResult = await waitForCompletion(taskId);

    const totalTime = Date.now() - overallStartTime;
    logger.info(`[Generate] =================== 图片生成完成 ===================`);
    logger.info(`[Generate] 总耗时: ${totalTime}ms, taskId: ${taskId}, imageId: ${statusResult.imageId}`);

    return {
      taskId,
      imageId: statusResult.imageId,
      imageUrl: statusResult.imageUrl,
    };
  } catch (error) {
    const totalTime = Date.now() - overallStartTime;
    logger.error(`[Generate] 生成失败, 耗时: ${totalTime}ms, 错误: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createGenerateTask,
  getTaskStatus,
  waitForCompletion,
  generateImage,
  logger,
};