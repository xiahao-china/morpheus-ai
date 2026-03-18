const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { NodeSSH } = require('node-ssh');
const SftpClient = require('ssh2-sftp-client');

const ssh = new NodeSSH();
const sftp = new SftpClient();

// 从参数中获取配置路径
const args = process.argv.slice(2);
const configPathArg = args.find(arg => arg.startsWith('--config='));
const configPath = configPathArg ? configPathArg.split('=')[1] : '../config.json';
const isDev = args.includes('--dev');

// 加载配置
const absoluteConfigPath = path.resolve(__dirname, configPath);
if (!fs.existsSync(absoluteConfigPath)) {
  console.error(`未找到配置文件: ${absoluteConfigPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
const serverConfig = config.frontendServer;

if (!serverConfig || !serverConfig.host || !serverConfig.username || !serverConfig.password) {
  console.error('config.json 中的 SSH 配置无效。请确保存在包含 host、username 和 password 的 "frontendServer" 对象。');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WEB_MOBILE_DIR = path.join(PROJECT_ROOT, 'web-mobile');
const REMOTE_DIR = serverConfig.remoteRootPath || '/data/morpheus-ai/front';
// 根据配置文件判断是否是测试环境，以此决定前端资源目录名
const isTestEnv = configPath.includes('test');
const APP_DIR_NAME = isTestEnv ? 'morpheus-ai-web-mobile-test' : 'morpheus-ai-web-mobile';
const TAR_FILE_NAME = isTestEnv ? 'web-mobile-test.tar.gz' : 'web-mobile.tar.gz';
const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);
const REMOTE_TAR_PATH = `${REMOTE_DIR}/${TAR_FILE_NAME}`;

const main = async () => {
  try {
    // 1. 打包构建产物
    console.log('正在打包...');
    const distDir = path.join(WEB_MOBILE_DIR, 'dist');
    const tempDir = path.join(PROJECT_ROOT, 'web-mobile-temp');

    if (!fs.existsSync(distDir)) {
      console.error('构建产物目录不存在，请先运行 npm run build:mobile');
      process.exit(1);
    }

    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      execSync(`rm -rf ${tempDir}`);
    }

    // 复制 dist 目录并重命名为 morpheus-ai-web-mobile
    fs.mkdirSync(tempDir, { recursive: true });
    execSync(`cp -r "${distDir}" "${tempDir}/${APP_DIR_NAME}"`);

    // 打包
    execSync(`tar -czf "${TAR_FILE_NAME}" -C "${PROJECT_ROOT}" web-mobile-temp`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });

    // 清理临时目录
    execSync(`rm -rf ${tempDir}`);
    console.log(`打包完成: ${LOCAL_TAR_PATH}`);

    // 2. 连接服务器
    console.log('正在连接服务器...');
    await sftp.connect({
      host: serverConfig.host,
      port: serverConfig.port || 22,
      username: serverConfig.username,
      password: serverConfig.password
    });
    console.log('SFTP 已连接。');

    await ssh.connect({
      host: serverConfig.host,
      port: serverConfig.port || 22,
      username: serverConfig.username,
      password: serverConfig.password
    });
    console.log('SSH 已连接。');

    // 确保远程目录存在
    try {
      console.log(`正在确保目录存在: ${REMOTE_DIR}`);
      const mkdirResult = await ssh.execCommand(`mkdir -p ${REMOTE_DIR}`);
      if (mkdirResult.code !== 0) {
        console.log('SSH mkdir 失败，正在尝试使用 sudo...');
        const sudoMkdirResult = await ssh.execCommand(`echo '${serverConfig.password}' | sudo -S mkdir -p ${REMOTE_DIR}`);
        if (sudoMkdirResult.code !== 0) {
          console.error('Sudo mkdir 失败:', sudoMkdirResult.stderr);
        } else {
          await ssh.execCommand(`echo '${serverConfig.password}' | sudo -S chown -R ${serverConfig.username} ${REMOTE_DIR}`);
        }
      }
    } catch (e) {
      console.log('远程目录创建警告:', e.message);
    }

    // 3. 上传压缩包
    console.log(`正在上传 ${TAR_FILE_NAME} 到 ${REMOTE_TAR_PATH}...`);
    await sftp.put(LOCAL_TAR_PATH, REMOTE_TAR_PATH);
    console.log('上传完成。');

    // 4. 解压并配置
    console.log('正在解压并配置...');
    const deployCommand = `
      cd ${REMOTE_DIR} &&
      rm -rf ${APP_DIR_NAME}.bak || true &&
      mv ${APP_DIR_NAME} ${APP_DIR_NAME}.bak 2>/dev/null || true &&
      tar -xzf ${TAR_FILE_NAME} &&
      mv web-mobile-temp/${APP_DIR_NAME} ${APP_DIR_NAME} &&
      rm -rf web-mobile-temp ${TAR_FILE_NAME} &&
      echo '部署完成!'
    `;

    const result = await ssh.execCommand(deployCommand, {
      onStdout: (chunk) => process.stdout.write(chunk.toString()),
      onStderr: (chunk) => process.stderr.write(chunk.toString())
    });

    if (result.code !== 0) {
      console.error('\n部署命令执行失败。');
    } else {
      console.log('\n移动端部署完成!');
      console.log(`访问地址: http://${serverConfig.host}/${APP_DIR_NAME}/`);
    }

  } catch (err) {
    console.error('部署失败:', err);
  } finally {
    sftp.end();
    ssh.dispose();
    // 清理本地压缩包
    if (fs.existsSync(LOCAL_TAR_PATH)) {
      fs.unlinkSync(LOCAL_TAR_PATH);
      console.log('本地压缩包已清理。');
    }
  }
};

main();