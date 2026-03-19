import { Context as KoaContext } from "koa";
import { getLogger } from "@/lib/log4js";

export type Context = KoaContext | any;

export const logger = getLogger("MembershipController");
export const DEFAULT_PAY_TYPE = "wap";
export const DEFAULT_PAYMENT_METHOD = "ALIPAY";

export const isAlipayPayment = (paymentMethod: string) => paymentMethod === DEFAULT_PAYMENT_METHOD;
