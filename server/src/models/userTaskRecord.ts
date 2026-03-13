import mongoose, { Schema, Document } from "mongoose";

export interface IUserTaskRecord extends Document {
  userId: string;
  taskCode: string; // Using taskCode or taskId
  completionCount: number;
  lastCompletionTime: Date;
  status: number; // 1-InProgress, 2-Completed
  createdTime: Date;
  updatedTime: Date;
}

const UserTaskRecordSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  taskCode: { type: String, required: true },
  completionCount: { type: Number, default: 0 },
  lastCompletionTime: { type: Date },
  status: { type: Number, default: 1 },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.models.UserTaskRecord || mongoose.model<IUserTaskRecord>("UserTaskRecord", UserTaskRecordSchema);
