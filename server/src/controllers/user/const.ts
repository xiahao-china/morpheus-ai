import axios from "axios";
import qs from "qs";
import { logger } from "@/lib/log4js";
import { SMS_CONFIG } from "@/config/index";
import { sendEmail as sendEmailUtil } from "@/utils/email";
import verificationCodeTemplate from "@/static/verificationCodeTemplate";

// 发送短信验证码
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
      }
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

// 发送邮箱验证码
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