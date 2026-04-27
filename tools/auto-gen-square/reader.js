/**
 * 读取 JSON 文件获取生图提示词
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const logger = {
  debug: (...args) => config.logLevel === 'debug' && console.log('[DEBUG]', new Date().toISOString(), ...args),
  info: (...args) => (config.logLevel === 'debug' || config.logLevel === 'info') && console.log('[INFO]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
};

/**
 * 读取 prompts.json 文件
 * @returns {Array<{prompt: string, title?: string, caption?: string}>}
 */
function loadPrompts() {
  const promptsPath = path.resolve(__dirname, config.promptsFile);

  logger.debug(`[Reader] 读取提示词文件: ${promptsPath}`);

  if (!fs.existsSync(promptsPath)) {
    logger.error(`[Reader] 文件不存在: ${promptsPath}`);
    throw new Error(`Prompts file not found: ${promptsPath}`);
  }

  let content;
  try {
    content = fs.readFileSync(promptsPath, 'utf-8');
  } catch (error) {
    logger.error(`[Reader] 读取文件失败: ${error.message}`);
    throw error;
  }

  let prompts;
  try {
    prompts = JSON.parse(content);
  } catch (error) {
    logger.error(`[Reader] JSON 解析失败: ${error.message}`);
    throw error;
  }

  if (!Array.isArray(prompts)) {
    logger.error(`[Reader] 文件内容必须是数组，当前类型: ${typeof prompts}`);
    throw new Error('Prompts file must contain an array');
  }

  const validPrompts = prompts.filter(item => item.prompt);
  const filteredCount = prompts.length - validPrompts.length;

  logger.info(`[Reader] 加载提示词: 总数=${prompts.length}, 有效=${validPrompts.length}, 过滤=${filteredCount}`);

  if (config.logLevel === 'debug') {
    validPrompts.forEach((item, idx) => {
      logger.debug(`[Reader] [${idx}] prompt: ${item.prompt.substring(0, 60)}...`);
      logger.debug(`[Reader] [${idx}] title: ${item.title || '未设置'}, caption: ${item.caption || '未设置'}`);
    });
  }

  return validPrompts;
}

/**
 * 获取单条提示词
 * @param {number} index - 索引
 * @returns {{prompt: string, title?: string, caption?: string} | null}
 */
function getPromptByIndex(index) {
  const prompts = loadPrompts();

  if (index < 0 || index >= prompts.length) {
    logger.warn(`[Reader] 索引越界: ${index}, 范围: 0-${prompts.length - 1}`);
    return null;
  }

  const item = prompts[index];
  logger.debug(`[Reader] 获取提示词 [${index}]: ${item.prompt.substring(0, 40)}...`);

  return item;
}

/**
 * 获取所有提示词数量
 * @returns {number}
 */
function getPromptsCount() {
  const count = loadPrompts().length;
  logger.debug(`[Reader] 提示词总数: ${count}`);
  return count;
}

module.exports = {
  loadPrompts,
  getPromptByIndex,
  getPromptsCount,
  logger,
};