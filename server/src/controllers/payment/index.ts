import * as paymentService from "@/services/payment";
import { sendResponse } from "@/utils/const";
import { Context, DEFAULT_PAY_TYPE, logger } from "./const";

export const createPayment = async (ctx: Context) => {
  const { packageId, payType = DEFAULT_PAY_TYPE } = ctx.request.body as any;
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

export const notify = async (ctx: Context) => {
  const params = ctx.request.body as any;

  logger.info("Alipay Notify Params:", params);

  try {
    const isValid = paymentService.verifyAlipaySignature(params);

    if (isValid) {
      const { out_trade_no, trade_no, total_amount } = params;
      const success = await paymentService.handlePaymentSuccess(out_trade_no, trade_no, total_amount);

      ctx.body = success ? "success" : "fail";
    } else {
      logger.error("Alipay Notify Signature Verification Failed");
      ctx.body = "fail";
    }
  } catch (error) {
    logger.error("Alipay Notify Error:", error);
    ctx.body = "fail";
  }
};
