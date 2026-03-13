import mongoose, { Schema, Document } from "mongoose";

export interface IGenerationQueue extends Document {
  taskId: string; // Associated task ID (e.g., ImageGeneration ID)
  userId: string; // User who initiated the task
  status: string; // 'queued', 'processing', 'completed', 'failed'
  provider?: string; // 'COMFYUI' or 'THIRD_PARTY'
  priority: number; // Priority level (higher = sooner)
  progress: number; // Progress percentage (0-100)
  payload: any; // Task payload (prompt, model, params)
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  sseId?: string; // SSE ID for real-time progress updates
}

const GenerationQueueSchema: Schema = new Schema({
  taskId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
  provider: { type: String, default: 'COMFYUI' },
  priority: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  payload: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String },
  sseId: { type: String }
}, {
  timestamps: true
});

// Index for efficient queue processing
GenerationQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
GenerationQueueSchema.index({ status: 1, provider: 1, priority: -1, createdAt: 1 });

export default mongoose.model<IGenerationQueue>("GenerationQueue", GenerationQueueSchema);
