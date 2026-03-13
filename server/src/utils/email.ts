import { createTransport } from 'nodemailer';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EMAIL_CONFIG } from "@/config/index";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("EmailUtils");

/**
 * 邮件发送参数接口
 */
export interface ISendMailParams {
  senAimEmail: string;  // 收件人邮箱
  subject: string;      // 邮件主题
  text: string;         // 纯文本内容
  html?: string;        // HTML内容（可选）
}

/**
 * SMTP传输配置
 * 从配置文件中读取邮件服务配置
 */
const TRANSPORT_USER_CONFIG: SMTPTransport.Options = {
  service: EMAIL_CONFIG.service, // 邮件服务商，如 "qq"
  host: EMAIL_CONFIG.host,       // SMTP服务器地址，如 "smtp.qq.com"
  port: EMAIL_CONFIG.port,       // 端口号，如 465
  auth: {
    user: EMAIL_CONFIG.auth.user,    // 发件人邮箱
    pass: EMAIL_CONFIG.auth.pass,    // SMTP授权码
  },
  secure: EMAIL_CONFIG.secure, // 是否使用SSL，465端口通常为true
};

/**
 * 发送邮件
 * @param params - 邮件参数对象
 * @returns 发送成功返回 true，失败抛出异常
 *
 * @example
 * await sendEmail({
 *   senAimEmail: "user@example.com",
 *   subject: "验证码",
 *   text: "您的验证码是123456",
 *   html: "<h1>您的验证码是123456</h1>"
 * })
 */
export const sendEmail = async (params: ISendMailParams) => {
  try {
    // 创建邮件传输器
    const transPort = createTransport(TRANSPORT_USER_CONFIG);

    // 发送邮件
    await transPort.sendMail({
      to: params.senAimEmail,           // 收件人
      from: TRANSPORT_USER_CONFIG.auth?.user,  // 发件人（与配置一致）
      subject: params.subject,          // 邮件主题
      text: params.text,                // 纯文本内容
      html: params.html,                // HTML内容
    });

    // 关闭传输器连接
    transPort.close();
    logger.info(`Email sent to ${params.senAimEmail}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to send email to ${params.senAimEmail}:`, error.message);
    throw error;
  }
};