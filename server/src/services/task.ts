import { ACTIVE_TASKS, TaskFrequencyEnum } from "@/config/activeTask";
import UserTaskRecord, { TaskStatusEnum } from "@/models/userTaskRecord";
import PointsRecord from "@/models/pointsRecord";
import User from "@/models/user";
import { logger } from "@/lib/log4js";

/**
 * Increment Task Progress
 * @param userId User ID
 * @param taskCode Task Code
 * @param count Increment count (default 1)
 */
export const incrementTaskProgress = async (userId: string, taskCode: string, count: number = 1) => {
  try {
    const task = ACTIVE_TASKS.find(t => t.code === taskCode && t.isEnabled);
    if (!task) return; // Task not found or disabled

    let record = await UserTaskRecord.findOne({ userId, taskCode });

    // Handle Daily Task Reset
    if (task.frequency === TaskFrequencyEnum.DAILY) {
      if (record) {
        const lastUpdate = new Date(record.updatedTime);
        const now = new Date();
        const isSameDay = lastUpdate.getDate() === now.getDate() && 
                          lastUpdate.getMonth() === now.getMonth() && 
                          lastUpdate.getFullYear() === now.getFullYear();
        
        if (!isSameDay) {
          // Reset progress for new day
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

    // If already completed/claimed, do nothing (unless it was reset above)
    if (record.status !== TaskStatusEnum.IN_PROGRESS) return;

    // Update Progress
    record.progress += count;

    // Check Completion
    if (record.progress >= task.targetCount) {
      record.progress = task.targetCount; // Cap at target
      record.status = TaskStatusEnum.COMPLETED;
      record.completionTime = new Date();
    }
    
    // Explicitly update updatedTime for daily check
    record.updatedTime = new Date();

    await record.save();

  } catch (error) {
    logger.error(`Error incrementing task progress for user ${userId}, task ${taskCode}:`, error);
  }
};

/**
 * Claim Reward
 * @param userId User ID
 * @param taskCode Task Code (Used to be ID, now Code)
 */
export const claimReward = async (userId: string, taskCode: string) => {
  const task = ACTIVE_TASKS.find(t => t.code === taskCode);
  if (!task) throw new Error("Task not found");

  const record = await UserTaskRecord.findOne({ userId, taskCode: task.code });
  
  // Special handling for 'newcomer_report': if not exists, create it as completed (since they are registered)
  if (!record && task.code === 'newcomer_report') {
      // Auto-complete
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

  // Check Status
  if (record.status === TaskStatusEnum.IN_PROGRESS) throw new Error("Task not completed yet");
  if (record.status === TaskStatusEnum.CLAIMED) throw new Error("Reward already claimed");

  return await processClaim(userId, task, record);
};

// Helper to process the actual claim transaction
const processClaim = async (userId: string, task: any, record: any) => {
  try {
    // 1. Mark as Claimed
    record.status = TaskStatusEnum.CLAIMED;
    record.claimTime = new Date();
    await record.save();

    // 2. Add Points Record
    const pointsRecord = new PointsRecord({
      userId,
      pointType: 'TASK_REWARD',
      points: task.rewardPoints,
      effectiveTime: new Date()
    });
    await pointsRecord.save();

    // 3. Update User Balance
    await User.findByIdAndUpdate(userId, { $inc: { points: task.rewardPoints } });

    return { rewardPoints: task.rewardPoints };

  } catch (error) {
    logger.error(`Error claiming reward for user ${userId}, task ${task.code}:`, error);
    throw error;
  }
};

/**
 * Get User Task List with Status
 */
export const getUserTasks = async (userId: string) => {
  const tasks = ACTIVE_TASKS.filter(t => t.isEnabled).sort((a, b) => a.sort - b.sort);
  const records = await UserTaskRecord.find({ userId });

  return tasks.map(task => {
    let record = records.find(r => r.taskCode === task.code);
    
    // Virtual Reset for Display
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
           // It's a new day, show as 0 progress
           status = TaskStatusEnum.IN_PROGRESS;
           progress = 0;
        }
      } else {
        status = record.status;
        progress = record.progress;
      }
    } else if (task.code === 'newcomer_report') {
        // Newcomer task is implicitly completed for all registered users if they haven't claimed it yet
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
      status,     // 0: InProgress, 1: Completed(Claimable), 2: Claimed
      progress
    };
  });
};
