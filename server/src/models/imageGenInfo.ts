import mongoose, { Schema, Document } from "mongoose";

export interface IImageGenInfo extends Document {
  userId?: string; // Associated user
  imageGenTaskId: string; // Associated generation task ID
  fileResourceId: string; // Associated file resource ID
  imageUrl: string; // Image URL
  width: number;
  height: number;
  
  // Feedback
  isLiked?: boolean; // True: Liked, False: Disliked, Undefined: No feedback
  
  createdTime: Date;
  updatedTime: Date;
}

const ImageGenInfoSchema: Schema = new Schema({
  userId: { type: String },
  imageGenTaskId: { type: String, required: true },
  fileResourceId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  
  isLiked: { type: Boolean }, // true=like, false=dislike, null/undefined=none
  
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IImageGenInfo>("ImageGenInfo", ImageGenInfoSchema);
