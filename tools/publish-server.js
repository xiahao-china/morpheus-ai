const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const SftpClient = require('ssh2-sftp-client');
const { execSync } = require('child_process');

// SSH 客户端
const ssh = new NodeSSH();
const sftp = new SftpClient();

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
    console.error('config.json 中的 SSH 配置无效。请确保存在包含 host、username 和 password 的 "backendServer" 或 "ssh" 对象。');
    process.exit(1);
  }

  return { config, serverConfig };
}

// ==================== 步骤1: 打包本地 dist ====================
function packageServer(PROJECT_ROOT, SERVER_DIR) {
  console.log('正在打包服务端 dist...');

  const distDir = path.join(SERVER_DIR, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('构建产物目录不存在，请先运行 npm run build:server');
    process.exit(1);
  }

  // 创建临时打包目录
  const serverDistDir = path.join(PROJECT_ROOT, 'server-dist-temp');
  if (fs.existsSync(serverDistDir)) {
    fs.rmSync(serverDistDir, { recursive: true, force: true });
  }
  fs.mkdirSync(serverDistDir, { recursive: true });

  // 复制必要文件
  fs.cpSync(distDir, path.join(serverDistDir, 'dist'), { recursive: true });
  const workflowsDir = path.join(SERVER_DIR, 'src', 'assets', 'workflows');
  if (fs.existsSync(workflowsDir)) {
    fs.mkdirSync(path.join(serverDistDir, 'src', 'assets'), { recursive: true });
    fs.cpSync(workflowsDir, path.join(serverDistDir, 'src', 'assets', 'workflows'), { recursive: true });
  }
  fs.copyFileSync(path.join(SERVER_DIR, 'Dockerfile'), path.join(serverDistDir, 'Dockerfile'));
  fs.copyFileSync(path.join(SERVER_DIR, 'package.json'), path.join(serverDistDir, 'package.json'));
  fs.copyFileSync(path.join(SERVER_DIR, 'package-lock.json'), path.join(serverDistDir, 'package-lock.json'));

  // 打包
  const TAR_FILE_NAME = 'release-server.tar.gz';
  const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);

  try {
    const excludeArgs = '--exclude "node_modules" --exclude ".git"';
    execSync(`tar ${excludeArgs} -czf "${TAR_FILE_NAME}" -C "${PROJECT_ROOT}" server-dist-temp`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log(`打包完成: ${LOCAL_TAR_PATH}`);
  } catch (e) {
    console.error('打包失败:', e.message);
    fs.rmSync(serverDistDir, { recursive: true, force: true });
    process.exit(1);
  } finally {
    // 清理临时目录
    fs.rmSync(serverDistDir, { recursive: true, force: true });
  }

  return { TAR_FILE_NAME, LOCAL_TAR_PATH };
}

// ==================== 步骤2: 连接服务器并上传 ====================
async function connectAndUpload(serverConfig, REMOTE_DIR, TAR_FILE_NAME, LOCAL_TAR_PATH) {
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
  await ensureRemoteDir(serverConfig, REMOTE_DIR);

  // 上传文件
  await uploadFile(REMOTE_DIR, TAR_FILE_NAME, LOCAL_TAR_PATH);

  return { REMOTE_TAR_PATH: `${REMOTE_DIR}/${TAR_FILE_NAME}` };
}

async function ensureRemoteDir(serverConfig, REMOTE_DIR) {
  console.log(`正在确保目录存在: ${REMOTE_DIR}`);
  try {
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

  // 使用 SFTP 再次确保目录存在
  try {
    await sftp.mkdir(REMOTE_DIR, true);
  } catch (e) {
    // 目录可能已存在，忽略错误
  }
}

async function uploadFile(REMOTE_DIR, TAR_FILE_NAME, LOCAL_TAR_PATH) {
  const REMOTE_TAR_PATH = `${REMOTE_DIR}/${TAR_FILE_NAME}`;

  // 验证本地文件存在
  const localFileStats = fs.statSync(LOCAL_TAR_PATH);
  console.log(`本地文件大小: ${localFileStats.size} bytes`);

  console.log(`正在上传 ${TAR_FILE_NAME} 到 ${REMOTE_TAR_PATH}...`);
  await sftp.put(LOCAL_TAR_PATH, REMOTE_TAR_PATH);

  // 验证上传成功
  const remoteFileExists = await sftp.exists(REMOTE_TAR_PATH);
  if (!remoteFileExists) {
    throw new Error('文件上传失败，远程文件不存在');
  }
  console.log('上传完成。');
}

// ==================== 步骤3: Docker 构建并运行 ====================
async function buildAndRunDocker(config, REMOTE_DIR, TAR_FILE_NAME) {
  console.log('正在解压并重启服务端 (预构建 dist)...');

  const serverPort = config.server?.port || 3000;
  const projectName = serverPort === 3001 ? 'morpheus_test' : 'morpheus_prod';
  const dockerNetworkName = config.server?.dockerNetwork || 'tools_backend';

  // 构建清理命令
  const cleanByNameCmd = `docker rm -f morpheus-server-${serverPort} || true`;
  const cleanDeployFilesCmd = `find . -mindepth 1 -maxdepth 1 ! -name "${TAR_FILE_NAME}" -exec rm -rf {} +`;
  const ensureDockerNetworkCmd = `docker network inspect ${dockerNetworkName} >/dev/null 2>&1 || docker network create ${dockerNetworkName}`;
  const connectDependenciesCmd = `for svc in mongodb redis minio; do docker inspect "$svc" >/dev/null 2>&1 && docker network connect ${dockerNetworkName} "$svc" >/dev/null 2>&1 || true; done`;

  // 服务器部署命令
  const deployCommand = `
    cd ${REMOTE_DIR} &&
    ${cleanDeployFilesCmd} &&
    tar -xzf ${TAR_FILE_NAME} &&
    cd server-dist-temp &&
    npm install --registry=https://registry.npmjs.org/ --no-audit --no-fund &&
    ${ensureDockerNetworkCmd} &&
    ${connectDependenciesCmd} &&
    docker network inspect ${dockerNetworkName} >/dev/null 2>&1 ||
    (echo "缺少 Docker 网络 ${dockerNetworkName}，请先执行 publish:env" && exit 1) &&
    DOCKER_BUILDKIT=1 docker build --network=host -t morpheus-server:${serverPort} . --build-arg APP_ENV=${projectName} --build-arg SERVER_PORT=${serverPort} &&
    (${cleanByNameCmd}) &&
    docker run -d --name morpheus-server-${serverPort} -e PORT=3000 -p ${serverPort}:3000 --network ${dockerNetworkName} morpheus-server:${serverPort} &&
    rm -rf server-dist-temp
  `;

  const result = await ssh.execCommand(deployCommand, {
    onStdout: (chunk) => process.stdout.write(chunk.toString()),
    onStderr: (chunk) => process.stderr.write(chunk.toString())
  });

  if (result.code !== 0) {
    throw new Error('服务端部署命令执行失败');
  }

  console.log('\n服务端部署完成!');
}

// ==================== 步骤4: 收尾清理 ====================
async function cleanup(LOCAL_TAR_PATH) {
  console.log('正在清理资源...');

  sftp.end();
  ssh.dispose();

  // 清理本地压缩包
  if (fs.existsSync(LOCAL_TAR_PATH)) {
    fs.unlinkSync(LOCAL_TAR_PATH);
    console.log('本地压缩包已清理。');
  }
}

// ==================== 主流程 ====================
const main = async () => {
  // 从参数中获取配置路径
  const args = process.argv.slice(2);
  const configPathArg = args.find(arg => arg.startsWith('--config='));
  const configPath = configPathArg ? configPathArg.split('=')[1] : '../config.json';

  // 加载配置
  const { config, serverConfig } = loadConfig(configPath);

  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
  const REMOTE_DIR = config.server.rootPath || serverConfig.remoteRootPath || '/data/morpheus-ai';

  try {
    // 步骤1: 打包本地 dist
    const { TAR_FILE_NAME, LOCAL_TAR_PATH } = packageServer(PROJECT_ROOT, SERVER_DIR);

    // 步骤2: 连接服务器并上传
    await connectAndUpload(serverConfig, REMOTE_DIR, TAR_FILE_NAME, LOCAL_TAR_PATH);

    // 步骤3: Docker 构建并运行
    await buildAndRunDocker(config, REMOTE_DIR, TAR_FILE_NAME);

  } catch (err) {
    console.error('服务端部署失败:', err);
  } finally {
    // 步骤4: 收尾清理
    try {
      const { TAR_FILE_NAME } = { TAR_FILE_NAME: 'release-server.tar.gz' };
      const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);
      await cleanup(LOCAL_TAR_PATH);
    } catch (e) {
      // 忽略清理错误
    }
  }
};

main();
