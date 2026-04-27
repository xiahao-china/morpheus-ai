import { Context as KoaContext } from "koa";
import axios from "axios";
import qs from "qs";
import { logger } from "@/lib/log4js";
import { REDIS_KEYS, SMS_CONFIG, USER_CONSTANTS, serverConfig } from "@/config/index";
import { sendEmail as sendEmailUtil } from "@/utils/email";
import verificationCodeTemplate from "@/static/verificationCodeTemplate";

export type Context = KoaContext | any;

export const VERIFY_CODE_TYPE_PHONE = "phone";
export const VERIFY_CODE_TYPE_EMAIL = "email";
export const VERIFY_CODE_TYPE_USERNAME = "username";
export const LOGIN_COOKIE_KEY = "token";
export const LOGIN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export const MOCK_VERIFY_CODE = "666666";

export const generateVerifyCode = () => {
  if (SMS_CONFIG.mockSend) return MOCK_VERIFY_CODE;
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const buildVerifyCodeRedisKey = (type: string, target: string) => {
  if (type === VERIFY_CODE_TYPE_PHONE) return `${REDIS_KEYS.SMS_LOGIN_CODE}${target}`;
  if (type === VERIFY_CODE_TYPE_EMAIL) return `${REDIS_KEYS.EMAIL_LOGIN_CODE}${target}`;
  return "";
};

export const getVerifyCodeExpireSeconds = () => USER_CONSTANTS.VERIFY_CODE_EXPIRE_SECONDS;
export const shouldSendVerificationMessage = () => !SMS_CONFIG.mockSend;

export const getLoginCookieOptions = () => ({
  maxAge: LOGIN_COOKIE_MAX_AGE,
  httpOnly: true,
  // 生产环境且非测试端口下使用 secure
  secure: process.env.NODE_ENV === "production" && serverConfig?.server?.port !== 3001,
  path: "/",
  sameSite: "lax" as const
});

export const isMockVerifyCode = (code: string) => SMS_CONFIG.mockSend && code === MOCK_VERIFY_CODE;

export const getTargetFieldByType = (type: string) => {
  if (type === VERIFY_CODE_TYPE_PHONE) return "phone";
  if (type === VERIFY_CODE_TYPE_EMAIL) return "email";
  return "";
};

export const sendSMS = async (phone: string, code: string) => {
  // 测试环境直接返回
  if (SMS_CONFIG.mockSend) {
    logger.info(`[MOCK] Sending SMS to ${phone}: ${code}`);
    return true;
  }

  logger.info(`Sending SMS to ${phone}: ${code}`);

  try {
    const data = {
      accesskey: SMS_CONFIG.accesskey,
      secret: SMS_CONFIG.secret,
      sign: SMS_CONFIG.sign,
      templateId: SMS_CONFIG.templateId,
      mobile: phone,
      content: code
    };

    const response = await axios.post(SMS_CONFIG.baseUrl, qs.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      proxy: false
    });

    logger.info(`SMS Response: ${JSON.stringify(response.data)}`);

    if (response.data && response.data.code === "0") {
      return true;
    } else {
      logger.error(`SMS Send Failed: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logger.error(`SMS Send Error: ${error}`);
    return false;
  }
};

export const sendEmail = async (email: string, code: string) => {
  logger.info(`Sending Email to ${email}: ${code}`);
  try {
    await sendEmailUtil({
      senAimEmail: email,
      subject: "Morpheus AI - Verification Code",
      text: `Your verification code is ${code}`,
      html: verificationCodeTemplate.replace("<---var-mailVerCode--->", code)
    });
    return true;
  } catch (error) {
    logger.error(`Email Send Error: ${error}`);
    return false;
  }
};
