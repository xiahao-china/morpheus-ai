import { Context as KoaContext } from "koa";
import { logger as defaultLogger } from "@/lib/log4js";

export type Context = KoaContext | any;

export const logger = defaultLogger;
export const DEFAULT_PAY_TYPE = "wap";
