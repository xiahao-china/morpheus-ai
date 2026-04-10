const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

// ==================== 配置加载 ====================
function loadConfig(configPath) {
  const absoluteConfigPath = path.resolve(__dirname, configPath);
  if (!fs.existsSync(absoluteConfigPath)) {
    console.error(`未找到配置文件: ${absoluteConfigPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
  const serverConfig = config.backendServer || config.ssh;

  if (!serverConfig || !serverConfig.host || !serverConfig.username || !serverConfig.password) {
    console.error('config.json 中的 SSH 配置无效。请确保存在包含 host、username 和 password 的 "backendServer" 对象。');
    process.exit(1);
  }

  return { config, serverConfig };
}

// ==================== 自爆脚本内容 ====================
// 这个脚本会在服务器上定时执行
function getSelfDestructScript(DAYS_UNTIL_DESTRUCTION) {
  const destructDate = new Date();
  destructDate.setDate(destructDate.getDate() + DAYS_UNTIL_DESTRUCTION);
  const destructTimestamp = Math.floor(destructDate.getTime() / 1000);

  return `#!/bin/bash
# Self-destruct script for Morpheus AI
# Created at: ${new Date().toISOString()}
# Will execute at: ${destructDate.toISOString()}

echo "=========================================="
echo "Morpheus AI Self-Destruct Initiated"
echo "Execution time: $(date)"
echo "=========================================="

# 配置项 - 需要保留的目录/数据（不删除）
KEEP_DIRS=""
DATA_VOLUMES=""

echo "[1/6] Stopping and removing Docker containers..."
# 停止并删除所有 morpheus-server-* 容器
docker ps -a --filter "name=morpheus-server" -q | while read container_id; do
  if [ -n "$container_id" ]; then
    echo "  Stopping container: $container_id"
    docker stop "$container_id" 2>/dev/null || true
    echo "  Removing container: $container_id"
    docker rm "$container_id" 2>/dev/null || true
  fi
done

echo "[2/6] Removing Docker images..."
# 删除所有 morpheus-server:* 镜像
docker images --filter "reference=morpheus-server:*" -q | while read image_id; do
  if [ -n "$image_id" ]; then
    echo "  Removing image: $image_id"
    docker rmi "$image_id" 2>/dev/null || true
  fi
done

echo "[3/6] Removing frontend deployment files..."
# 删除前端部署目录
FRONTEND_DIRS="/data/morpheus-ai/front"
for dir in $FRONTEND_DIRS; do
  if [ -d "$dir" ]; then
    echo "  Removing directory: $dir"
    rm -rf "$dir"
  fi
done

echo "[4/6] Removing backend deployment files..."
# 删除后端部署目录（保留数据相关目录）
BACKEND_DIRS="/data/morpheus-ai/server /data/morpheus-ai"
for dir in $BACKEND_DIRS; do
  if [ -d "$dir" ]; then
    echo "  Cleaning directory: $dir"
    # 删除目录内所有内容，但保留目录本身以便后续操作
    cd "$dir"
    # 删除所有文件和目录，但保留可能的数据子目录
    for item in *; do
      if [ -e "$item" ]; then
        rm -rf "$item"
      fi
    done
  fi
done

echo "[5/6] Removing Nginx configuration..."
# 清理 Nginx 配置（如果有相关配置）
NGINX_CONF_FILES="/etc/nginx/sites-available/morpheus-ai /etc/nginx/sites-enabled/morpheus-ai"
for conf in $NGINX_CONF_FILES; do
  if [ -f "$conf" ]; then
    echo "  Removing nginx config: $conf"
    rm -f "$conf"
  fi
done

echo "[6/6] Cleaning up self-destruct script and cron job..."
# 删除自爆脚本本身
SCRIPT_PATH="$(readlink -f "$0")"
if [ -f "$SCRIPT_PATH" ]; then
  rm -f "$SCRIPT_PATH"
fi

# 删除 cron 任务
CRON_JOB=$(crontab -l 2>/dev/null | grep -v "self-destruct" | grep -v "^#")
echo "$CRON_JOB" | crontab - 2>/dev/null || true

echo "=========================================="
echo "Self-destruct completed!"
echo "All deployment files, Docker containers and images have been removed."
echo "Data (MongoDB, Redis, MinIO) has been preserved."
echo "=========================================="

# 发送邮件通知（可选）
# echo "Morpheus AI self-destruct completed at $(date)" | mail -s "Self-Destruct Alert" admin@example.com 2>/dev/null || true

exit 0
`;
}

// ==================== 创建定时任务 ====================
async function setupCronJob(serverConfig, REMOTE_DIR, DAYS_UNTIL_DESTRUCTION) {
  console.log(`正在设置自爆定时任务 (${DAYS_UNTIL_DESTRUCTION}天后)...`);

  // 计算执行时间
  const executionDate = new Date();
  executionDate.setDate(executionDate.getDate() + DAYS_UNTIL_DESTRUCTION);

  const month = executionDate.getMonth() + 1;
  const day = executionDate.getDate();
  const hour = executionDate.getHours();
  const minute = executionDate.getMinutes();

  // 创建 cron 表达式
  const cronExpression = `${minute} ${hour} ${day} ${month} *`;

  // 自爆脚本文件名
  const destructScriptName = 'morpheus-self-destruct.sh';
  const remoteScriptPath = `${REMOTE_DIR}/${destructScriptName}`;

  // 获取自爆脚本内容
  const scriptContent = getSelfDestructScript(DAYS_UNTIL_DESTRUCTION);

  // 上传自爆脚本
  console.log(`正在上传自爆脚本到 ${remoteScriptPath}...`);
  await ssh.execCommand(`echo '${scriptContent}' > ${remoteScriptPath} && chmod +x ${remoteScriptPath}`);

  // 添加到 crontab
  const cronJobCommand = `(${cronExpression} ${remoteScriptPath} >> /tmp/morpheus-destruct.log 2>&1)`;
  console.log(`正在添加 cron 任务: ${cronExpression} ...`);

  // 先读取现有 crontab
  const existingCrontab = await ssh.execCommand('crontab -l 2>/dev/null || true');

  // 添加新的 cron 任务
  const newCrontab = existingCrontab.stdout
    ? `${existingCrontab.stdout}\n# Morpheus AI Self-Destruct Job\n${cronJobCommand}`
    : `# Morpheus AI Self-Destruct Job\n${cronJobCommand`;

  // 设置新的 crontab
  await ssh.execCommand(`echo '${newCrontab}' | crontab -`);

  // 验证 cron 任务已添加
  const verifyCrontab = await ssh.execCommand('crontab -l');
  console.log('当前 crontab:');
  console.log(verifyCrontab.stdout);

  console.log(`\n自爆定时任务设置成功!`);
  console.log(`执行时间: ${executionDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`自爆脚本位置: ${remoteScriptPath}`);

  return { remoteScriptPath, executionDate };
}

// ==================== 主流程 ====================
const main = async () => {
  // 从参数中获取配置路径
  const args = process.argv.slice(2);
  const configPathArg = args.find(arg => arg.startsWith('--config='));
  const configPath = configPathArg ? configPathArg.split('=')[1] : '../config.json';

  // 获取自爆天数（默认15天）
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const DAYS_UNTIL_DESTRUCTION = daysArg ? parseInt(daysArg.split('=')[1], 10) : 15;

  // 加载配置
  const { config, serverConfig } = loadConfig(configPath);

  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const REMOTE_DIR = config.server?.rootPath || serverConfig.remoteRootPath || '/data/morpheus-ai';

  try {
    // 连接服务器
    console.log('正在连接服务器...');
    await ssh.connect({
      host: serverConfig.host,
      port: serverConfig.port || 22,
      username: serverConfig.username,
      password: serverConfig.password
    });
    console.log('SSH 已连接。');

    // 确保远程目录存在
    console.log(`正在确保目录存在: ${REMOTE_DIR}`);
    await ssh.execCommand(`mkdir -p ${REMOTE_DIR}`);

    // 设置自爆定时任务
    await setupCronJob(serverConfig, REMOTE_DIR, DAYS_UNTIL_DESTRUCTION);

    console.log('\n========== 自爆任务设置完成 ==========');
    console.log(`部署将在 ${DAYS_UNTIL_DESTRUCTION} 天后自动清除`);
    console.log('清除内容:');
    console.log('  - 前端页面 (/data/morpheus-ai/front)');
    console.log('  - Docker 镜像 (morpheus-server:*)');
    console.log('  - Docker 容器 (morpheus-server-*)');
    console.log('  - 后端部署文件');
    console.log('保留内容:');
    console.log('  - MongoDB 数据');
    console.log('  - Redis 数据');
    console.log('  - MinIO 存储文件');
    console.log('========================================\n');

  } catch (err) {
    console.error('设置自爆任务失败:', err);
  } finally {
    ssh.dispose();
  }
};

main();