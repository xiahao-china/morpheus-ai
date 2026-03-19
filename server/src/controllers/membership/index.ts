import { Context as KoaContext } from "koa";
type Context = KoaContext | any;
import MembershipPackage from "@/models/membershipPackage";
import * as paymentService from "@/services/payment";
import { getLogger } from "@/lib/log4js";
import { sendResponse, EReqStatus } from "@/utils/const";

const logger = getLogger("MembershipController");

/**
 * 获取会员套餐列表
 * 返回所有已启用的套餐，按等级排序
 */
export const getPackages = async (ctx: Context) => {
  try {
    const packages = await MembershipPackage.find({ isEnabled: true }).sort({ levelSort: 1 });
    sendResponse.success(ctx, packages);
  } catch (error: any) {
    logger.error("Failed to get membership packages:", error);
    sendResponse.error(ctx, error.message || "Internal server error");
  }
};

/**
 * 创建会员订单
 * packageId: 套餐ID
 * payType: 支付类型（wap/app等）
 * paymentMethod: 支付方式（目前仅支持 ALIPAY）
 */
export const createOrder = async (ctx: Context) => {
  const { packageId, payType = 'wap', paymentMethod = 'ALIPAY' } = ctx.request.body as any;
  const user = ctx.state.user as any;

  if (!packageId) {
    ctx.body = { code: 400, msg: "Package ID is required" };
    return;
  }

  try {
    const pkg = await MembershipPackage.findById(packageId);
    if (!pkg) {
      ctx.body = { code: 404, msg: "Package not found" };
      return;
    }

    if (paymentMethod === 'ALIPAY') {
      const result = await paymentService.createAlipayOrder(user._id, packageId, payType);
      sendResponse.success(ctx, result);
    } else {
      ctx.body = { code: 400, msg: "Unsupported payment method. Currently only ALIPAY is supported." };
    }

  } catch (error: any) {
    sendResponse.error(ctx, error.message || "Internal server error");
  }
};