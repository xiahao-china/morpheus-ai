import { IObject } from "@/utils/const";

// 全局服务器配置（通过 webpack DefinePlugin 从 config.json 注入）
// 测试时，如果 process.env.serverConfig 未定义，提供一个默认空对象
export const serverConfig: IObject = ((process.env.serverConfig as unknown) as IObject) || {};

// 短信服务配置（来自 Java 项目）
export const SMS_CONFIG = {
  baseUrl: "http://api.1cloudsp.com/api/v2/single_send",
  accesskey: "wBxaKP3jV4QN5Vbs",
  secret: "0IN2ey7XS0O4eBkB3Kqg7lXF0sFoClWm",
  sign: "【深圳市星元云创】",
  templateId: "323293",
  // 开发环境下默认开启 mock，生产环境关闭
  mockSend: process.env.NODE_ENV !== 'production'
};

// Redis 键常量
export const REDIS_KEYS = {
  SMS_LOGIN_CODE: "verify:phone:",
  EMAIL_LOGIN_CODE: "verify:email:",
  WECHAT_LOGIN_STATE: "wechat:login:state:",    // 微信扫码登录状态 key
  WECHAT_LOGIN_CODE: "wechat:login:code:",      // 微信扫码登录临时 code
};

// 用户常量
export const USER_CONSTANTS = {
  VERIFY_CODE_EXPIRE_SECONDS: 300, // 5分钟
};

// MongoDB 配置
export const MONGO_CONFIG = {
  URL: serverConfig?.mongodb?.url || "mongodb://127.0.0.1:27017/morpheus-ai"
};

// Redis 配置
export const REDIS_CONFIG = {
  host: serverConfig?.redis?.host || "127.0.0.1",
  port: serverConfig?.redis?.port || 6379,
  password: serverConfig?.redis?.password,
  db: serverConfig?.redis?.db || 0
};

// MinIO 配置
export const MINIO_CONFIG = {
  endPoint: serverConfig?.minio?.endPoint || "127.0.0.1",
  port: serverConfig?.minio?.port || 9000,
  useSSL: serverConfig?.minio?.useSSL || false,
  accessKey: serverConfig?.minio?.accessKey || "minio_admin",
  secretKey: serverConfig?.minio?.secretKey || "minio_secret_key",
  publicBaseUrl: serverConfig?.minio?.publicBaseUrl || "",
};

export const MINIO_BUCKET_NAME = serverConfig?.minio?.bucket || "morpheus-ai";

// 邮箱配置
export const EMAIL_CONFIG = {
  service: serverConfig?.email?.service || "qq",
  host: serverConfig?.email?.host || "smtp.qq.com",
  port: serverConfig?.email?.port || 465,
  secure: serverConfig?.email?.secure !== undefined ? serverConfig.email.secure : true,
  auth: {
    user: serverConfig?.email?.user || "471087639@qq.com",
    pass: serverConfig?.email?.pass || serverConfig?.mailAuthPass || ""
  }
};
