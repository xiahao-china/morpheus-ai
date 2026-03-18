const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const SftpClient = require('ssh2-sftp-client');

const { execSync } = require('child_process');

const ssh = new NodeSSH();
const sftp = new SftpClient();

// 从参数中获取配置路径
const args = process.argv.slice(2);
const configPathArg = args.find(arg => arg.startsWith('--config='));
const configPath = configPathArg ? configPathArg.split('=')[1] : '../config.json';

// 加载配置
const absoluteConfigPath = path.resolve(__dirname, configPath);
if (!fs.existsSync(absoluteConfigPath)) {
  console.error(`未找到配置文件: ${absoluteConfigPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
const serverConfig = config.backendServer || config.ssh; // 默认使用 backendServer

if (!serverConfig || !serverConfig.host || !serverConfig.username || !serverConfig.password) {
  console.error('config.json 中的 SSH 配置无效。请确保存在包含 host、username 和 password 的 "backendServer" 或 "ssh" 对象。');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REMOTE_DIR = config.server.rootPath || serverConfig.remoteRootPath || '/data/morpheus-ai';
const TAR_FILE_NAME = 'release-server.tar.gz';
const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);
const REMOTE_TAR_PATH = `${REMOTE_DIR}/${TAR_FILE_NAME}`;

const main = async () => {
  try {
    // 1. 打包本地代码 (服务端代码和工具配置)
    console.log('正在打包服务端代码...');
    try {
      // 在项目根目录执行打包命令，排除 node_modules, dist, .git 等
      const excludeArgs = '--exclude "node_modules" --exclude "dist" --exclude ".git"';
      execSync(`tar ${excludeArgs} -czf "${TAR_FILE_NAME}" server tools`, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
      console.log(`打包完成: ${LOCAL_TAR_PATH}`);
    } catch (e) {
      console.error('打包失败:', e.message);
      process.exit(1);
    }

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

    // 2. 上传压缩包
    console.log(`正在上传 ${TAR_FILE_NAME} 到 ${REMOTE_TAR_PATH}...`);
    await sftp.put(LOCAL_TAR_PATH, REMOTE_TAR_PATH);
    console.log('上传完成。');

    console.log('正在解压并重启服务端 (Node.js Server)...');

    // 从配置文件中读取端口，默认3000
    const serverPort = config.server?.port || 3000;

    // 只启动 Server 服务 (依赖 MongoDB/Redis/MinIO 已经运行)
    // 如果是测试环境，可以在 docker-compose 中定义不同服务名，或者我们依然叫 server
    // 为了简单起见，如果指定了特定的部署路径或端口，我们动态调整环境变量传给 docker-compose
    const servicesToStart = 'server';

    // 端口清理列表 (动态获取)
    const portsToCheck = [serverPort.toString()];

    // 构建清理命令：按名称清理 + 按端口清理
    const cleanByPortCmd = portsToCheck.map(port =>
       `for id in $(docker ps -q --filter "publish=${port}"); do echo "Found container $id on port ${port}, removing..."; docker rm -f $id; done`
    ).join(' && ');

    // 传递 SERVER_PORT 和 COMPOSE_PROJECT_NAME 环境变量给 docker-compose，避免多环境容器名冲突
    const projectName = serverPort === 3001 ? 'morpheus_test' : 'morpheus_prod';

    const deployCommand = `
      cd ${REMOTE_DIR} &&
      tar -xzf ${TAR_FILE_NAME} &&
      ${cleanByPortCmd} &&
      cd server &&
      npm install --registry=https://registry.npmjs.org/ &&
      DOCKER_BUILDKIT=1 docker build --network=host -t morpheus-server:${serverPort} . &&
      docker run -d --name morpheus-server-${serverPort} -p ${serverPort}:3000 --network host morpheus-server:${serverPort}
    `;

    // 使用 execCommand 并监听输出，实现实时日志
    const result = await ssh.execCommand(deployCommand, {
      onStdout: (chunk) => process.stdout.write(chunk.toString()),
      onStderr: (chunk) => process.stderr.write(chunk.toString())
    });

    if (result.code !== 0) {
      console.error('\n服务端部署命令执行失败。');
    } else {
      console.log('\n服务端部署完成!');
    }

  } catch (err) {
    console.error('服务端部署失败:', err);
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