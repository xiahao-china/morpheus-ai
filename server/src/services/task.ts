import { ACTIVE_TASKS, TaskFrequencyEnum } from "@/config/activeTask";
import UserTaskRecord, { TaskStatusEnum } from "@/models/userTaskRecord";
import PointsRecord from "@/models/pointsRecord";
import User from "@/models/user";
import { logger } from "@/lib/log4js";

/**
 * 增加任务进度
 * @param userId 用户ID
 * @param taskCode 任务代码
 * @param count 增加的进度值（默认1）
 */
export const incrementTaskProgress = async (userId: string, taskCode: string, count: number = 1) => {
  try {
    const task = ACTIVE_TASKS.find(t => t.code === taskCode && t.isEnabled);
    if (!task) return; // 任务未找到或已禁用

    let record = await UserTaskRecord.findOne({ userId, taskCode });

    // 处理每日任务重置
    if (task.frequency === TaskFrequencyEnum.DAILY) {
      if (record) {
        const lastUpdate = new Date(record.updatedTime);
        const now = new Date();
        const isSameDay = lastUpdate.getDate() === now.getDate() &&
                          lastUpdate.getMonth() === now.getMonth() &&
                          lastUpdate.getFullYear() === now.getFullYear();

        if (!isSameDay) {
          // 新一天，重置进度
          record.progress = 0;
          record.status = TaskStatusEnum.IN_PROGRESS;
          record.completionTime = undefined;
          record.claimTime = undefined;
        }
      }
    }

    if (!record) {
      record = new UserTaskRecord({
        userId,
        taskCode,
        progress: 0,
        status: TaskStatusEnum.IN_PROGRESS
      });
    }

    // 如果已完成或已领取，则不处理（除非在上面被重置了）
    if (record.status !== TaskStatusEnum.IN_PROGRESS) return;

    // 更新进度
    record.progress += count;

    // 检查是否完成
    if (record.progress >= task.targetCount) {
      record.progress = task.targetCount; // 限制在目标值
      record.status = TaskStatusEnum.COMPLETED;
      record.completionTime = new Date();
    }

    // 明确更新updatedTime用于每日检查
    record.updatedTime = new Date();

    await record.save();

  } catch (error) {
    logger.error(`Error incrementing task progress for user ${userId}, task ${taskCode}:`, error);
  }
};

/**
 * 领取任务奖励
 * @param userId 用户ID
 * @param taskCode 任务代码
 */
export const claimReward = async (userId: string, taskCode: string) => {
  const task = ACTIVE_TASKS.find(t => t.code === taskCode);
  if (!task) throw new Error("Task not found");

  const record = await UserTaskRecord.findOne({ userId, taskCode: task.code });

  // 特殊处理 'newcomer_report'：如果不存在，则创建为已完成状态（因为用户已注册）
  if (!record && task.code === 'newcomer_report') {
      // 自动完成
      const newRecord = new UserTaskRecord({
          userId,
          taskCode: task.code,
          progress: 1,
          status: TaskStatusEnum.COMPLETED,
          completionTime: new Date()
      });
      await newRecord.save();
      return await processClaim(userId, task, newRecord);
  }

  if (!record) throw new Error("Task record not found");

  // 检查状态
  if (record.status === TaskStatusEnum.IN_PROGRESS) throw new Error("Task not completed yet");
  if (record.status === TaskStatusEnum.CLAIMED) throw new Error("Reward already claimed");

  return await processClaim(userId, task, record);
};

/**
 * 处理实际领取交易的辅助函数
 * @param userId 用户ID
 * @param task 任务对象
 * @param record 用户任务记录
 */
const processClaim = async (userId: string, task: any, record: any) => {
  try {
    // 1. 标记为已领取
    record.status = TaskStatusEnum.CLAIMED;
    record.claimTime = new Date();
    await record.save();

    // 2. 添加积分记录
    const pointsRecord = new PointsRecord({
      userId,
      pointType: 'TASK_REWARD',
      points: task.rewardPoints,
      effectiveTime: new Date()
    });
    await pointsRecord.save();

    // 3. 更新用户余额
    await User.findByIdAndUpdate(userId, { $inc: { points: task.rewardPoints } });

    return { rewardPoints: task.rewardPoints };

  } catch (error) {
    logger.error(`Error claiming reward for user ${userId}, task ${task.code}:`, error);
    throw error;
  }
};

/**
 * 获取用户任务列表及其状态
 * @param userId 用户ID
 */
export const getUserTasks = async (userId: string) => {
  const tasks = ACTIVE_TASKS.filter(t => t.isEnabled).sort((a, b) => a.sort - b.sort);
  const records = await UserTaskRecord.find({ userId });

  return tasks.map(task => {
    let record = records.find(r => r.taskCode === task.code);

    // 用于显示的虚拟重置
    let status = TaskStatusEnum.IN_PROGRESS;
    let progress = 0;

    if (record) {
      if (task.frequency === TaskFrequencyEnum.DAILY) {
        const lastUpdate = new Date(record.updatedTime);
        const now = new Date();
        const isSameDay = lastUpdate.getDate() === now.getDate() &&
                          lastUpdate.getMonth() === now.getMonth() &&
                          lastUpdate.getFullYear() === now.getFullYear();
        if (isSameDay) {
          status = record.status;
          progress = record.progress;
        } else {
           // 新的一天，显示为0进度
           status = TaskStatusEnum.IN_PROGRESS;
           progress = 0;
        }
      } else {
        status = record.status;
        progress = record.progress;
      }
    } else if (task.code === 'newcomer_report') {
        // 新人任务对所有已注册但未领取的用户默认完成
        status = TaskStatusEnum.COMPLETED;
        progress = 1;
    }

    return {
      code: task.code,
      name: task.name,
      description: task.description,
      type: task.type,
      rewardPoints: task.rewardPoints,
      targetCount: task.targetCount,
      icon: task.icon,
      status,     // 0: 进行中, 1: 已完成(可领取), 2: 已领取
      progress
    };
  });
};