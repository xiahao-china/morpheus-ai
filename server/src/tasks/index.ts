import { ScheduledTask } from "@/lib/scheduled-tasks";
import { generationScheduler } from "@/services/generation-scheduler";

/**
 * 图像生成队列检查任务
 * 每10秒触发一次，确保队列中的任务被处理
 */
export const generationQueueCheckTask: ScheduledTask = {
  name: "generationQueueCheck",
  interval: 10000, // 10秒
  handler: async () => {
    // logger.info("Executing scheduled generation queue check...");
    generationScheduler.triggerCheck();
  },
  enabled: true
};

// 其他任务可以在这里添加
// export const sslCheckTask: ScheduledTask = { ... };
// export const dataBackupTask: ScheduledTask = { ... };
// export const fileClearTask: ScheduledTask = { ... };
