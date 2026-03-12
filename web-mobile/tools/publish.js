import fs from 'fs'
import SftpClient from 'ssh2-sftp-client'
import iconv from 'iconv-lite'
import { NodeSSH } from 'node-ssh'
import os from 'os'
import readline from 'readline'
import { execSync } from 'child_process'

// config配置中涉及敏感信息，请找相关人员获取
import config from '../serverConfig.js'

const sftp = new SftpClient()

const params = Object.fromEntries(
  process.argv
    .filter((item) => item.startsWith("--"))
    .reduce((pre, item) => {
      if (item.startsWith("--")) {
        return [...pre, item.slice(2).split("=")];
      }
      console.log(pre);
      return pre;
    }, [])
);

const isDev = params.AIM.includes("dev");
const isSeo = params.AIM.includes("seo");
const isWindows = os.type() === "Windows_NT";

const FILE_PATH = {
  localFileName: `dist`,
  aimFileName: `tuiqiao-mobile${isDev ? "-dev" : ""}`,
  uploadPath: config.path,
  seoAimFileName: `ai_design_seo`,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


const zipFile = () => {
  const filePathName = FILE_PATH.localFileName;
  try {
    // const hasFile = fs.existsSync(`./${filePathName}`);
    const hasTar = fs.existsSync(`./${filePathName}.tar.gz`);
    // if (hasFile)
    //   execSync(
    //     isWindows ? `rmdir /s /q ${filePathName}` : `rm -rf ${filePathName}`
    //   );
    if (hasTar)
      execSync(
        isWindows
          ? `del ${filePathName}.tar.gz`
          : `rm -rf ${filePathName}.tar.gz`
      );
    execSync(`tar -zcvf ${filePathName}.tar.gz ${filePathName}`);
    execSync(
      isWindows ? `rmdir /s /q ${filePathName}` : `rm -rf ${filePathName}`
    );
  } catch (err) {
    console.log(iconv.decode(err, "utf-8"));
  }
};

const uploadFile = async () => {
  async function uploadFolder(localPath, remotePath) {
    await sftp.put(localPath, remotePath);
    console.log(`已上传文件: ${localPath} -> ${remotePath}`);
  }

  if (isSeo){
    console.log(`即将更新SEO预渲染页面`);
  }else {
    console.log(`将为${isDev ? "测试" : "正式"}环境进行部署`);
  }
  try {
    await sftp.connect(config.defaultServerConfig);
    console.log("成功连接到SFTP服务器，开始传输部署tar文件，请稍后...");
    await uploadFolder(
      `./${FILE_PATH.localFileName}.tar.gz`,
      `${FILE_PATH.uploadPath}/${FILE_PATH.localFileName}.tar.gz`
    );
    console.log("文件上传完成");
    rl.close();
    sftp.end();
  } catch (err) {
    console.error("SFTP服务失败:", err);
    rl.close();
    sftp.end();
  }
};

const decompressionServerTar = () => {
  const ssh = new NodeSSH();

  async function run() {
    try {
      const handleConfig = config.defaultServerConfig;
      await ssh.connect({
        host: handleConfig.host,
        port: handleConfig.port,
        username: handleConfig.username,
        password: handleConfig.password,
      });
      const commonStrList = [
        `cd ${FILE_PATH.uploadPath}`,
        `rm -rf ./${FILE_PATH.aimFileName}`,
        `tar -zxvf ./${FILE_PATH.localFileName}.tar.gz`,
        `rm -rf ./${FILE_PATH.localFileName}.tar.gz`,
        `mv ./${FILE_PATH.localFileName} ./${FILE_PATH.aimFileName}`
      ];
      await ssh.execCommand(commonStrList.join(";"));
      console.log("部署完成!");
      // 关闭连接
      await ssh.dispose();
    } catch (error) {
      console.log(iconv.decode(err.stdout, 'GBK'));
    }
  }

  run();
};

// 为seo部署
const seoDeploy = async () => {
  const ssh = new NodeSSH();
  try {
    const handleConfig = config.defaultServerConfig;
    await ssh.connect({
      host: handleConfig.host,
      port: handleConfig.port,
      username: handleConfig.username,
      password: handleConfig.password,
    });
    const commonStrList = [
      `cd ${FILE_PATH.uploadPath}`,
      `rm -rf ./${FILE_PATH.seoAimFileName}`,
      `tar -zxvf ./${FILE_PATH.localFileName}.tar.gz`,
      `rm -rf ./${FILE_PATH.localFileName}.tar.gz`,
      `mv ./${FILE_PATH.localFileName} ./${FILE_PATH.seoAimFileName}`,
    ];
    await ssh.execCommand(commonStrList.join(";"));
    console.log("seo部署完成!");
    // 关闭连接
    await ssh.dispose();
  } catch (error) {
    console.log(iconv.decode(err.stdout, 'GBK'));
  }
};

const main = async () => {
  // 静态页面部署
  zipFile();
  await uploadFile();
  if (isSeo){
    await seoDeploy();
    return;
  }
  decompressionServerTar();
};

main();
