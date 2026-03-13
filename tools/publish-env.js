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
const TAR_FILE_NAME = 'release-env.tar.gz';
const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);
const REMOTE_TAR_PATH = `${REMOTE_DIR}/${TAR_FILE_NAME}`;

const main = async () => {
  try {
    // 1. 打包本地代码 (只打包 tools 目录和必要的配置文件，用于启动环境服务)
    console.log('正在打包环境配置代码...');
    try {
      const excludeArgs = '--exclude "node_modules" --exclude "dist" --exclude ".git"';
      // 只打包 tools 目录，因为 docker-compose.yml 在 tools 目录下
      execSync(`tar ${excludeArgs} -czf "${TAR_FILE_NAME}" tools`, {
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

    console.log('正在解压并重启环境服务 (MongoDB, Redis, MinIO)...');
    
    // 只启动基础服务
    const servicesToStart = 'mongodb redis minio';
    
    // 端口清理列表 (MinIO: 9000/9002, Redis: 6379, Mongo: 27017)
    const portsToCheck = ['9000', '9002', '6379', '27017'];
    
    // 构建清理命令：按名称清理 + 按端口清理
    const cleanByPortCmd = portsToCheck.map(port => 
       `for id in $(docker ps -q --filter "publish=${port}"); do echo "Found container $id on port ${port}, removing..."; docker rm -f $id; done`
    ).join(' && ');

    const cleanByNameCmd = 'docker rm -f mongodb redis minio || true';

    const deployCommand = `
      cd ${REMOTE_DIR} &&
      tar -xzf ${TAR_FILE_NAME} &&
      cd tools &&
      ${cleanByNameCmd} &&
      ${cleanByPortCmd} &&
      (docker-compose up -d ${servicesToStart} || docker compose up -d ${servicesToStart})
    `;
    
    // 使用 execCommand 并监听输出，实现实时日志
    const result = await ssh.execCommand(deployCommand, {
      onStdout: (chunk) => process.stdout.write(chunk.toString()),
      onStderr: (chunk) => process.stderr.write(chunk.toString())
    });
    
    if (result.code !== 0) {
      console.error('\n环境部署命令执行失败。');
    } else {
      console.log('\n环境部署完成!');
    }

  } catch (err) {
    console.error('环境部署失败:', err);
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
