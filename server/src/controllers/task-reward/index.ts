import { Context } from "koa";
import * as taskService from "@/services/task";

/**
 * 获取用户任务列表
 * 返回用户可执行的任务及完成状态
 */
export const getTasks = async (ctx: Context) => {
  const user = ctx.state.user as any;
  try {
    const tasks = await taskService.getUserTasks(user._id);
    ctx.body = { code: 200, data: tasks };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
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
        ctx.body = {
            code: 200,
            msg: "Reward claimed",
            data: result
        };

    } catch (error) {
        ctx.body = { code: 500, msg: error.message || "Internal server error" };
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
        if (taskCode === 'daily_sign_in') {
            await taskService.incrementTaskProgress(user._id, taskCode, 1);
            ctx.body = { code: 200, msg: "Task progress updated" };
        } else {
            ctx.body = { code: 403, msg: "This task cannot be triggered manually" };
        }
    } catch (error) {
        ctx.body = { code: 500, msg: error.message || "Internal server error" };
    }
};