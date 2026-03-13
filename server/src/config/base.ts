import { IObject } from "@/utils/const";

// Global server configuration (injected via webpack DefinePlugin from config.json)
// For testing, provide a default object if process.env.serverConfig is undefined
export const serverConfig: IObject = ((process.env.serverConfig as unknown) as IObject) || {};

// SMS Service Configuration (from Java project)
export const SMS_CONFIG = {
  baseUrl: "http://api.1cloudsp.com/api/v2/single_send",
  accesskey: "wBxaKP3jV4QN5Vbs",
  secret: "0IN2ey7XS0O4eBkB3Kqg7lXF0sFoClWm",
  sign: "【深圳市星元云创】",
  templateId: "323293",
  // 开发环境下默认开启 mock，生产环境关闭
  mockSend: process.env.NODE_ENV !== 'production' 
};

// Redis Keys Constants
export const REDIS_KEYS = {
  SMS_LOGIN_CODE: "verify:phone:",
  EMAIL_LOGIN_CODE: "verify:email:",
  WECHAT_LOGIN_STATE: "wechat:login:state:",    // 微信扫码登录状态 key
  WECHAT_LOGIN_CODE: "wechat:login:code:",      // 微信扫码登录临时 code
};

// User Constants
export const USER_CONSTANTS = {
  VERIFY_CODE_EXPIRE_SECONDS: 300, // 5 minutes
};

// MongoDB Configuration
export const MONGO_CONFIG = {
  URL: serverConfig?.mongodb?.url || "mongodb://127.0.0.1:27017/morpheus-ai"
};

// Redis Configuration
export const REDIS_CONFIG = {
  host: serverConfig?.redis?.host || "127.0.0.1",
  port: serverConfig?.redis?.port || 6379,
  password: serverConfig?.redis?.password,
  db: serverConfig?.redis?.db || 0
};

// MinIO Configuration
export const MINIO_CONFIG = {
  endPoint: serverConfig?.minio?.endPoint || "127.0.0.1",
  port: serverConfig?.minio?.port || 9000,
  useSSL: serverConfig?.minio?.useSSL || false,
  accessKey: serverConfig?.minio?.accessKey || "minio_admin",
  secretKey: serverConfig?.minio?.secretKey || "minio_secret_key"
};

// Email Configuration
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
