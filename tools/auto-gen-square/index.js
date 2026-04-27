/**
 * 自动生图及发布到广场测试工具
 *
 * 使用方法:
 * 1. 修改 config.js 中的 auth.token 为你的用户 Token
 * 2. 在 prompts.json 中添加要生成的提示词
 * 3. 运行: node index.js
 *
 * 可选参数:
 *   node index.js --help           显示帮助
 *   node index.js --list           列出所有提示词
 *   node index.js --index 0        只生成指定索引的提示词
 *   node index.js --dry-run        仅测试 API 连接，不实际生成
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { loadPrompts, getPromptByIndex, getPromptsCount } = require('./reader');
const { generateImage, logger } = require('./generator');
const { publishToSquare } = require('./publisher');
const { initAuth } = require('./auth');

// 结果记录文件
const RESULTS_FILE = path.join(__dirname, 'results.json');

/**
 * 保存结果到文件
 * @param {Array} results - 结果数组
 */
function saveResults(results) {
  const data = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    success: results.filter(r => r.success).length,
    fail: results.filter(r => !r.success).length,
    results,
  };
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ 结果已保存到: ${RESULTS_FILE}`);
}

// 全局启动时间
const START_TIME = Date.now();

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          自动生图及发布广场测试工具 v1.0.0                   ║
╚════════════════════════════════════════════════════════════╝

使用方法:
  node index.js                   执行所有提示词
  node index.js --help            显示帮助
  node index.js --list            列出所有提示词
  node index.js --index <n>       只生成指定索引的提示词
  node index.js --dry-run         仅测试 API 连接

配置文件:
  config.js       - 服务端和认证配置
  prompts.json    - 生图提示词列表

日志级别配置 (config.js):
  logLevel: 'debug'  - 详细日志
  logLevel: 'info'   - 普通日志
  logLevel: 'warn'   - 仅警告和错误
  logLevel: 'error'  - 仅错误
  `);
}

/**
 * 打印提示词列表
 */
function listPrompts() {
  const prompts = loadPrompts();
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`提示词列表 (共 ${prompts.length} 条)`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  prompts.forEach((item, index) => {
    console.log(`[${index}] ${item.prompt.substring(0, 60)}${item.prompt.length > 60 ? '...' : ''}`);
    if (item.title) console.log(`    title: ${item.title}`);
    if (item.caption) console.log(`    caption: ${item.caption}`);
    console.log();
  });
}

/**
 * 测试 API 连接
 */
async function testConnection() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试 API 连接`);
  console.log(`=${'='.repeat(50)}`);

  try {
    const url = `${config.server.baseUrl}${config.server.apiPrefix}/user/info`;
    const response = await axios.get(url, {
      headers: {
        'Cookie': config.auth.cookie,
        'Authorization': `Bearer ${config.auth.token}`,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    console.log(`\n✓ API 连接正常`);
    console.log(`  Base URL: ${config.server.baseUrl}`);
    console.log(`  API Prefix: ${config.server.apiPrefix}`);
    console.log(`  Token: ${config.auth.token ? config.auth.token.substring(0, 20) + '...' : '未设置'}`);
    console.log(`  响应状态: ${response.status}`);

    if (response.data.code === 200 || response.data.code === 0) {
      console.log(`  用户: ${response.data.data?.username || '未知'}`);
    }

  } catch (error) {
    console.error(`\n✗ API 连接失败:`);
    console.error(`  错误: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error(`  原因: 无法连接到 ${config.server.baseUrl}`);
      console.error(`  建议: 请确保服务端已启动`);
    }
    process.exit(1);
  }
}

/**
 * 执行单条提示词的生图和发布
 * @param {object} promptItem - 提示词对象
 * @param {number} index - 索引
 * @param {number} total - 总数
 */
async function processPrompt(promptItem, index, total) {
  const { prompt, title, caption } = promptItem;
  const taskStartTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${index + 1}/${total}] 开始处理提示词`);
  console.log(`=${'='.repeat(60)}`);
  console.log(`Prompt: ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}`);
  console.log(`Title: ${title || config.square.defaultTitle}`);
  console.log(`Caption: ${caption || config.square.defaultCaption}`);

  try {
    // 1. 生成图片
    console.log(`\n--- 步骤 1/2: 生成图片 ---`);
    const { taskId, imageId, imageUrl } = await generateImage(prompt);

    console.log(`  ✓ 图片生成成功`);
    console.log(`    Task ID: ${taskId}`);
    console.log(`    Image ID: ${imageId}`);
    console.log(`    Image URL: ${imageUrl?.substring(0, 60)}...`);

    // 2. 发布到广场
    console.log(`\n--- 步骤 2/2: 发布到广场 ---`);
    const { squareId } = await publishToSquare(imageId, title, caption);

    console.log(`  ✓ 发布成功`);
    console.log(`    Square ID: ${squareId}`);
    console.log(`    Title: ${title || config.square.defaultTitle}`);

    // 统计耗时
    const taskTime = Date.now() - taskStartTime;
    console.log(`\n✓ 本次处理完成, 耗时: ${(taskTime / 1000).toFixed(2)}s`);

    return {
      success: true,
      index,
      prompt: prompt.substring(0, 100),
      title,
      caption,
      taskId,
      imageId,
      squareId,
      time: taskTime,
    };

  } catch (error) {
    const taskTime = Date.now() - taskStartTime;
    console.error(`\n✗ 处理失败, 耗时: ${(taskTime / 1000).toFixed(2)}s`);
    console.error(`  错误: ${error.message}`);
    return {
      success: false,
      index,
      prompt: prompt.substring(0, 100),
      title,
      error: error.message,
      time: taskTime,
    };
  }
}

/**
 * 主函数
 */
async function main() {
  const overallStartTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`自动生图及发布广场测试工具`);
  console.log(`启动时间: ${new Date().toISOString()}`);
  console.log(`=${'='.repeat(60)}`);
  console.log(`配置信息:`);
  console.log(`  服务端: ${config.server.baseUrl}`);
  console.log(`  生图模型: modelId=${config.generation.modelId}, 尺寸=${config.generation.width}x${config.generation.height}`);
  console.log(`  轮询间隔: ${config.generation.pollInterval}ms, 超时: ${config.generation.maxWaitTime}ms`);
  console.log(`  日志级别: ${config.logLevel}`);

  const args = process.argv.slice(2);

  // 解析参数
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--list') || args.includes('-l')) {
    listPrompts();
    return;
  }

  if (args.includes('--dry-run')) {
    await testConnection();
    return;
  }

  // 步骤 1: 读取配置并校验 Token
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`步骤 1: 初始化认证`);
  console.log(`─`.repeat(60));

  let user;
  try {
    user = await initAuth();
    console.log(`  ✓ 登录用户: ${user.username} (${user.userId})`);
    console.log(`  ✓ 用户角色: ${user.role}, 手机号: ${user.phone || '未绑定'}`);
  } catch (error) {
    console.error(`\n✗ 认证失败: ${error.message}`);
    process.exit(1);
  }

  // 步骤 2: 读取提示词 JSON
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`步骤 2: 读取提示词`);
  console.log(`─`.repeat(60));

  let promptsToProcess = [];
  const indexArg = args.findIndex(arg => arg === '--index' || arg === '-i');

  if (indexArg !== -1 && args[indexArg + 1] !== undefined) {
    const index = parseInt(args[indexArg + 1], 10);
    const promptItem = getPromptByIndex(index);
    if (!promptItem) {
      console.error(`错误: 索引 ${index} 不存在 (共 ${getPromptsCount()} 条)`);
      process.exit(1);
    }
    promptsToProcess = [promptItem];
    console.log(`  ✓ 加载单条提示词 [${index}]`);
  } else {
    promptsToProcess = loadPrompts();
    console.log(`  ✓ 加载了 ${promptsToProcess.length} 条提示词`);
  }

  // 步骤 3: 串行生图并发布（必须等上一个完成才进行下一个）
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`步骤 3: 开始串行生图 (共 ${promptsToProcess.length} 条)`);
  console.log(`─`.repeat(60));

  const results = [];
  for (let i = 0; i < promptsToProcess.length; i++) {
    const result = await processPrompt(promptsToProcess[i], i, promptsToProcess.length);
    results.push(result);

    // 每条之间稍作延迟
    if (i < promptsToProcess.length - 1) {
      console.log(`  等待 1 秒后处理下一条...\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 保存结果到文件
  saveResults(results);

  // 汇总结果
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalTime = Date.now() - overallStartTime;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`处理完成汇总`);
  console.log(`=${'='.repeat(60)}`);
  console.log(`  总数: ${results.length}`);
  console.log(`  成功: ${successCount}`);
  console.log(`  失败: ${failCount}`);
  console.log(`  总耗时: ${(totalTime / 1000).toFixed(2)}s`);

  if (successCount > 0) {
    const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.time, 0) / successCount;
    console.log(`  平均耗时: ${(avgTime / 1000).toFixed(2)}s/条`);
  }

  // 打印失败详情
  if (failCount > 0) {
    console.log(`\n失败详情:`);
    results.forEach((r, i) => {
      if (!r.success) {
        console.log(`  [${i}] ${r.error}`);
      }
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`程序结束`);
  console.log(`=${'='.repeat(60)}`);
}

// 启动
main().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});