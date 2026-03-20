import mongoose, { Schema, Document } from "mongoose";

export interface IUserImageCollect extends Document {
  userId: string;
  imageId: string;
  imageGenTaskId: string;
  createdTime: Date;
  updatedTime: Date;
}

const UserImageCollectSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  imageId: { type: String, required: true, index: true },
  imageGenTaskId: { type: String, required: true, index: true },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: "createdTime", updatedAt: "updatedTime" }
});

UserImageCollectSchema.index({ userId: 1, imageId: 1 }, { unique: true });

export default mongoose.models.UserImageCollect || mongoose.model<IUserImageCollect>("UserImageCollect", UserImageCollectSchema);
