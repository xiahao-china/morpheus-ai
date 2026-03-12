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

// 加载配置
const absoluteConfigPath = path.resolve(__dirname, configPath);
if (!fs.existsSync(absoluteConfigPath)) {
  console.error(`未找到配置文件: ${absoluteConfigPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
const serverConfig = config.frontendServer;
const nginxConfig = config.nginx;

if (!serverConfig || !serverConfig.host || !serverConfig.username || !serverConfig.password) {
  console.error('config.json 中的 SSH 配置无效。请确保存在包含 host、username 和 password 的 "frontendServer" 对象。');
  process.exit(1);
}

if (!nginxConfig || !nginxConfig.path) {
  console.error('config.json 中的 nginx 配置无效。请确保存在包含 path 的 "nginx" 对象。');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const NGINX_DIR = path.join(PROJECT_ROOT, 'tools', 'nginx');
const NGINX_PATH = nginxConfig.path;
const TAR_FILE_NAME = 'nginx-files.tar.gz';
const LOCAL_TAR_PATH = path.join(PROJECT_ROOT, TAR_FILE_NAME);
const TEMP_DIR = '/tmp/nginx-deploy';
const SUDO_PASS = serverConfig.password;

const main = async () => {
  try {
    // 1. 连接服务器
    console.log('正在连接服务器...');
    await ssh.connect({
      host: serverConfig.host,
      port: serverConfig.port || 22,
      username: serverConfig.username,
      password: serverConfig.password
    });
    console.log('SSH 已连接。');

    // 2. 创建临时目录
    console.log('正在创建临时目录...');
    await ssh.execCommand(`mkdir -p ${TEMP_DIR}`);

    // 3. 打包本地 nginx 配置
    console.log('正在打包 nginx 配置...');
    const filesDir = path.join(NGINX_DIR, 'files');
    const nginxConfFile = path.join(NGINX_DIR, 'nginx.conf');

    if (!fs.existsSync(nginxConfFile)) {
      console.error('nginx.conf 文件不存在');
      process.exit(1);
    }

    // 打包 files 目录
    if (fs.existsSync(filesDir) && fs.readdirSync(filesDir).length > 0) {
      execSync(`tar -czf "${TAR_FILE_NAME}" -C "${NGINX_DIR}" files`, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
      console.log(`打包完成: ${LOCAL_TAR_PATH}`);
    } else {
      console.log('files 目录不存在或为空，跳过');
    }

    // 4. 上传文件到临时目录
    console.log('正在上传 nginx.conf...');
    await sftp.connect({
      host: serverConfig.host,
      port: serverConfig.port || 22,
      username: serverConfig.username,
      password: serverConfig.password
    });
    console.log('SFTP 已连接。');

    await sftp.put(nginxConfFile, `${TEMP_DIR}/nginx.conf`);
    console.log('nginx.conf 上传完成。');

    if (fs.existsSync(LOCAL_TAR_PATH)) {
      console.log('正在上传 files 目录...');
      await sftp.put(LOCAL_TAR_PATH, `${TEMP_DIR}/${TAR_FILE_NAME}`);
      console.log('files 目录上传完成。');
    }

    await sftp.end();

    // 5. 移动文件到目标目录并解压
    console.log('正在部署配置...');
    const deployCommand = `
      echo '${SUDO_PASS}' | sudo -S cp ${TEMP_DIR}/nginx.conf ${NGINX_PATH}/nginx.conf &&
      echo '${SUDO_PASS}' | sudo -S chmod 644 ${NGINX_PATH}/nginx.conf &&
      cd ${NGINX_PATH} &&
      (echo '${SUDO_PASS}' | sudo -S rm -rf files.bak || true) &&
      (echo '${SUDO_PASS}' | sudo -S mv files files.bak 2>/dev/null || true) &&
      (if [ -f ${TEMP_DIR}/${TAR_FILE_NAME} ]; then echo '${SUDO_PASS}' | sudo -S tar -xzf ${TEMP_DIR}/${TAR_FILE_NAME}; fi) &&
      echo '${SUDO_PASS}' | sudo -S rm -f ${TEMP_DIR}/${TAR_FILE_NAME} &&
      rm -rf ${TEMP_DIR} &&
      echo '部署完成!'
    `;

    const result = await ssh.execCommand(deployCommand, {
      onStdout: (chunk) => process.stdout.write(chunk.toString()),
      onStderr: (chunk) => process.stderr.write(chunk.toString())
    });

    if (result.code !== 0) {
      console.error('\n部署命令执行失败。');
    }

    // 6. 测试并重启 nginx
    console.log('正在测试 nginx 配置...');
    const testResult = await ssh.execCommand(`echo '${SUDO_PASS}' | sudo -S nginx -t`, {
      onStdout: (chunk) => process.stdout.write(chunk.toString()),
      onStderr: (chunk) => process.stderr.write(chunk.toString())
    });

    if (testResult.code !== 0) {
      console.error('nginx 配置测试失败:', testResult.stderr);
    } else {
      console.log('正在重启 nginx...');
      const restartResult = await ssh.execCommand(`echo '${SUDO_PASS}' | sudo -S nginx -s stop && sudo nginx`, {
        onStdout: (chunk) => process.stdout.write(chunk.toString()),
        onStderr: (chunk) => process.stderr.write(chunk.toString())
      });

      if (restartResult.code !== 0) {
        console.error('nginx 重启失败，尝试启动...');
        await ssh.execCommand(`echo '${SUDO_PASS}' | sudo -S nginx`, {
          onStdout: (chunk) => process.stdout.write(chunk.toString()),
          onStderr: (chunk) => process.stderr.write(chunk.toString())
        });
      } else {
        console.log('nginx 重启成功!');
      }
    }

    console.log('\nNginx 配置更新完成!');
    console.log(`访问地址: http://${serverConfig.host}:8000`);

  } catch (err) {
    console.error('部署失败:', err);
  } finally {
    ssh.dispose();
    // 清理本地压缩包
    if (fs.existsSync(LOCAL_TAR_PATH)) {
      fs.unlinkSync(LOCAL_TAR_PATH);
      console.log('本地压缩包已清理。');
    }
  }
};

main();