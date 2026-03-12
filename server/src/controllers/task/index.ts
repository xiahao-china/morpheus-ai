import { Context } from "koa";
import { ActivityTaskConfig, UserTaskRecord } from "@/models/task";

export const getTaskList = async (ctx: Context) => {
  const user = ctx.state.user;
  // Get all tasks config
  const tasks = await ActivityTaskConfig.find();
  // Get user progress
  const userRecords = await UserTaskRecord.find({ userId: user.uid });
  
  const result = tasks.map(task => {
    const record = userRecords.find(r => r.taskCode === task._id.toString());
    return {
      ...task.toObject(),
      progress: record ? record.completionCount : 0,
      status: record ? record.status : 0
    };
  });
  
  ctx.body = { code: 200, data: result };
};

export const completeTask = async (ctx: Context) => {
  const user = ctx.state.user;
  const { taskId } = ctx.request.body as any;
  
  let record = await UserTaskRecord.findOne({ userId: user.uid, taskCode: taskId });
  if (!record) {
    record = new UserTaskRecord({ userId: user.uid, taskCode: taskId });
  }
  
  record.completionCount += 1;
  // Simple logic: complete after 1 time for now
  record.status = 2; 
  record.updatedTime = new Date();
  
  await record.save();
  ctx.body = { code: 200, data: record };
};
