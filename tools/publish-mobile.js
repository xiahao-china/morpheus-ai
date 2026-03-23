const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { NodeSSH } = require('node-ssh');
const SftpClient = require('ssh2-sftp-client');

// 检查是否是 Windows
const isWindows = process.platform === 'win32';

// 创建 tar.gz 压缩包的跨平台函数
async function createTarGz(sourceDir, targetPath) {
  // 使用 tar 命令
  try {
    execSync(`tar -czf "${targetPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`, {
      stdio: 'inherit'
    });
  } catch (e) {
    // Windows 上可能没有 tar，尝试使用 PowerShell
    if (isWindows) {
      try {
        // 注意：使用 .zip 扩展名以便服务器正确识别
        const zipPath = targetPath.replace('.tar.gz', '.zip');
        const psCommand = `Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${zipPath}" -Force`;
        execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
        // 重命名为 .tar.gz 以保持一致性（服务器会检测文件类型）
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        fs.renameSync(zipPath, targetPath);
        return;
      } catch (psErr) {
        console.error('压缩失败:', psErr.message);
        throw new Error('请安装 Git Bash 或 tar 命令以进行压缩');
      }
    }
    throw new Error('压缩失败: ' + e.message);
  }
}

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

    // 清理临时目录 (跨平台)
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // 复制 dist 目录并重命名为 morpheus-ai-web-mobile (跨平台)
    fs.mkdirSync(tempDir, { recursive: true });
    fs.cpSync(distDir, path.join(tempDir, APP_DIR_NAME), { recursive: true });

    // 打包 (跨平台)
    const tarPath = path.join(PROJECT_ROOT, TAR_FILE_NAME);
    await createTarGz(path.join(tempDir, APP_DIR_NAME), tarPath);

    // 清理临时目录 (跨平台)
    fs.rmSync(tempDir, { recursive: true, force: true });
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

    // 4. 解压并配置 - 使用更可靠的方式
    console.log('正在解压并配置...');

    // 首先备份旧目录
    await ssh.execCommand(`cd ${REMOTE_DIR} && rm -rf ${APP_DIR_NAME}.bak && mv ${APP_DIR_NAME} ${APP_DIR_NAME}.bak 2>/dev/null || true`);

    // 尝试 tar 解压
    const tarResult = await ssh.execCommand(`cd ${REMOTE_DIR} && tar -xzf ${TAR_FILE_NAME} 2>&1`, {
      onStderr: (chunk) => {}
    });

    let deploySuccess = false;
    if (tarResult.code === 0) {
      // tar 解压成功
      const moveResult = await ssh.execCommand(`cd ${REMOTE_DIR} && mv web-mobile-temp/${APP_DIR_NAME} ${APP_DIR_NAME}`);
      if (moveResult.code === 0) {
        deploySuccess = true;
      }
    }

    if (!deploySuccess) {
      // tar 失败，尝试 unzip
      console.log('tar 解压失败，尝试 unzip...');
      await ssh.execCommand(`cd ${REMOTE_DIR} && rm -rf web-mobile-temp && unzip -o ${TAR_FILE_NAME} -d . 2>&1`);

      // 查找解压后的目录
      const listResult = await ssh.execCommand(`cd ${REMOTE_DIR} && ls -la`);
      const output = listResult.stdout;

      // 尝试多个可能的目录名
      const possibleDirs = ['morpheus-ai-web-mobile', 'morpheus-ai-web-mobile-test', 'dist'];
      for (const dir of possibleDirs) {
        const checkResult = await ssh.execCommand(`cd ${REMOTE_DIR} && test -d ${dir} && echo "exists" || echo "not exists"`);
        if (checkResult.stdout.includes('exists')) {
          await ssh.execCommand(`cd ${REMOTE_DIR} && mv ${dir} ${APP_DIR_NAME}`);
          deploySuccess = true;
          break;
        }
      }
    }

    // 清理临时文件
    await ssh.execCommand(`cd ${REMOTE_DIR} && rm -rf web-mobile-temp ${TAR_FILE_NAME}`);

    if (deploySuccess) {
      console.log('\n移动端部署完成!');
      console.log(`访问地址: http://${serverConfig.host}/${APP_DIR_NAME}/`);
    } else {
      console.error('\n部署命令执行失败。');
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