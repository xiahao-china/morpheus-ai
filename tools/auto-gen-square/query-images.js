/**
 * 查询图片 URL 脚本
 * 通过 squareId 查询图片详情，获取 imageUrl
 */

const axios = require('axios');
const config = require('./config');

const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

/**
 * 通过 squareId 获取图片详情
 */
async function getSquareDetail(squareId) {
  const url = `${config.server.baseUrl}${config.server.apiPrefix}/square/${squareId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
      },
      timeout: 10000,
    });

    if (response.data.code === 200 || response.data.code === 0) {
      const data = response.data.data;
      // 从 drawTaskInfo 或 squareImage 获取 imageUrl
      const imageUrl = data?.drawTaskInfo?.imageUrl || data?.squareImage?.imageUrl || '';
      return { ...data, imageUrl };
    }
    logger.error(`获取详情失败: ${response.data.msg}`);
    return null;
  } catch (error) {
    logger.error(`请求失败: ${error.message}`);
    return null;
  }
}

/**
 * 批量查询
 */
async function main() {
  const results = require('./results.json');

  logger.info(`开始查询 ${results.results.length} 条记录的 imageUrl...`);
  logger.info(`服务端: ${config.server.baseUrl}`);
  console.log('');

  for (let i = 0; i < results.results.length; i++) {
    const item = results.results[i];
    const { title, squareId, imageId } = item;

    const detail = await getSquareDetail(squareId);

    if (detail) {
      console.log(`[${i + 1}] ${title}`);
      console.log(`    squareId: ${squareId}`);
      console.log(`    imageId: ${imageId}`);
      console.log(`    imageUrl: ${detail.imageUrl || '(无)'}`);
      console.log('');
    } else {
      console.log(`[${i + 1}] ${title} - 查询失败`);
      console.log('');
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  logger.info('查询完成');
}

main().catch(console.error);