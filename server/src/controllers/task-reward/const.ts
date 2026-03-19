import { Context as KoaContext } from "koa";
import { getLogger } from "@/lib/log4js";

export type Context = KoaContext | any;

export const logger = getLogger("TaskRewardController");
export const MANUAL_TRIGGER_TASK_CODE = "daily_sign_in";

export const canTriggerTaskManually = (taskCode: string) => taskCode === MANUAL_TRIGGER_TASK_CODE;
