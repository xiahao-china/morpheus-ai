import * as taskService from "@/services/task";
import { sendResponse } from "@/utils/const";
import { canTriggerTaskManually, Context, logger, MANUAL_TRIGGER_TASK_CODE } from "./const";

/**
 * 获取用户任务列表
 * 返回用户可执行的任务及完成状态
 */
export const getTasks = async (ctx: Context) => {
  const user = ctx.state.user as any;
  try {
    const tasks = await taskService.getUserTasks(user._id);
    sendResponse.success(ctx, tasks);
  } catch (error) {
    sendResponse.error(ctx, "Internal server error");
  }
};

/**
 * 领取任务奖励
 * taskId: 任务代码（对应配置中的 taskCode）
 */
export const claimReward = async (ctx: Context) => {
    const { taskId } = ctx.request.body as any;
    const user = ctx.state.user as any;

    if (!taskId) {
        ctx.body = { code: 400, msg: "Task Code is required" };
        return;
    }

    try {
        const result = await taskService.claimReward(user._id, taskId);
        sendResponse.success(ctx, result);

    } catch (error: any) {
        logger.error(`Error claiming reward for task ${taskId}:`, error);
        sendResponse.error(ctx, error.message || "Internal server error");
    }
};

/**
 * 执行任务动作（如手动签到）
 * 目前仅支持 daily_sign_in 手动触发
 */
export const performTask = async (ctx: Context) => {
    const { taskCode } = ctx.request.body as any;
    const user = ctx.state.user as any;

    if (!taskCode) {
        ctx.body = { code: 400, msg: "Task Code is required" };
        return;
    }

    try {
        if (canTriggerTaskManually(taskCode)) {
            await taskService.incrementTaskProgress(user._id, MANUAL_TRIGGER_TASK_CODE, 1);
            sendResponse.success(ctx, { msg: "Task progress updated" });
        } else {
            ctx.body = { code: 403, msg: "This task cannot be triggered manually" };
        }
    } catch (error: any) {
        sendResponse.error(ctx, error.message || "Internal server error");
    }
};
