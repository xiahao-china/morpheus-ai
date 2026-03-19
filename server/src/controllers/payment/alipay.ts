import { Context as KoaContext } from "koa";
type Context = KoaContext | any;
import * as paymentService from "@/services/payment";
import { logger } from "@/lib/log4js";
import { sendResponse, EReqStatus } from "@/utils/const";

/**
 * 创建支付宝支付订单
 * packageId: 套餐ID
 * payType: 支付方式（wap/H5/app等）
 */
export const createPayment = async (ctx: Context) => {
  const { packageId, payType = 'wap' } = ctx.request.body as any;
  const user = ctx.state.user as any;

  if (!packageId) {
    ctx.body = { code: 400, msg: "Package ID is required" };
    return;
  }

  try {
    const result = await paymentService.createAlipayOrder(user._id, packageId, payType);
    sendResponse.success(ctx, result);
  } catch (error: any) {
    logger.error("Alipay Create Payment Error:", error);
    sendResponse.error(ctx, error.message || "Internal server error");
  }
};

/**
 * 支付宝异步回调通知
 * 1. 验证签名
 * 2. 处理支付成功逻辑
 * 3. 返回 success 或 fail
 */
export const notify = async (ctx: Context) => {
  const params = ctx.request.body as any;

  logger.info("Alipay Notify Params:", params);

  try {
    const isValid = paymentService.verifyAlipaySignature(params);

    if (isValid) {
      const { out_trade_no, trade_no, total_amount } = params;
      const success = await paymentService.handlePaymentSuccess(out_trade_no, trade_no, total_amount);

      ctx.body = success ? 'success' : 'fail';
    } else {
      logger.error("Alipay Notify Signature Verification Failed");
      ctx.body = 'fail';
    }
  } catch (error) {
    logger.error("Alipay Notify Error:", error);
    ctx.body = 'fail';
  }
};