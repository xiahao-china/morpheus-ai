import { Context } from "koa";
import TaskConfig from "@/models/taskConfig";
import UserTaskRecord from "@/models/userTaskRecord";
import PointsRecord from "@/models/pointsRecord";

// 1. Get Task List
export const getTasks = async (ctx: Context) => {
  const user = ctx.state.user as any;
  try {
    const tasks = await TaskConfig.find({ status: 1 });
    
    // Check completion status for user
    const userRecords = await UserTaskRecord.find({ userId: user._id });
    
    const result = tasks.map(task => {
        const record = userRecords.find(r => r.taskCode === task.taskName); // Assuming taskName is taskCode for simplicity
        return {
            ...task.toObject(),
            completed: record ? record.status === 2 : false,
            progress: record ? record.completionCount : 0
        };
    });
    
    ctx.body = { code: 200, data: result };
  } catch (error) {
    ctx.body = { code: 500, msg: "Internal server error", error };
  }
};

// 2. Claim Task Reward (e.g., Daily Sign In)
export const claimReward = async (ctx: Context) => {
    const { taskId } = ctx.request.body as any;
    const user = ctx.state.user as any;

    if (!taskId) {
        ctx.body = { code: 400, msg: "Task ID is required" };
        return;
    }

    try {
        const task = await TaskConfig.findById(taskId);
        if (!task) {
            ctx.body = { code: 404, msg: "Task not found" };
            return;
        }

        // Check if already claimed/completed
        let record = await UserTaskRecord.findOne({ userId: user._id, taskCode: task.taskName });
        if (record && record.status === 2) {
             ctx.body = { code: 400, msg: "Task already completed" };
             return;
        }

        // Update User Task Record
        if (!record) {
            record = new UserTaskRecord({
                userId: user._id,
                taskCode: task.taskName,
                status: 2, // Mark as completed
                completionCount: 1,
                lastCompletionTime: new Date()
            });
        } else {
            record.status = 2;
            record.completionCount += 1;
            record.lastCompletionTime = new Date();
        }
        await record.save();

        // Add Points to User
        let pointsRecord = await PointsRecord.findOne({ userId: user._id });
        if (!pointsRecord) {
            pointsRecord = new PointsRecord({ userId: user._id, points: 0 });
        }
        pointsRecord.points += task.rewardAmount;
        await pointsRecord.save();

        ctx.body = { 
            code: 200, 
            msg: "Reward claimed", 
            data: { 
                rewardAmount: task.rewardAmount, 
                currentPoints: pointsRecord.points 
            } 
        };

    } catch (error) {
        ctx.body = { code: 500, msg: "Internal server error", error };
    }
};
