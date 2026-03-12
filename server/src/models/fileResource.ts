import mongoose, { Schema, Document } from "mongoose";

export interface IFileResource extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string; // MinIO path
  url?: string; // Access URL (presigned)
  bucket: string;
  userId?: string; // Uploader
  type?: string; // File type category (e.g. UNDER_IMAGE)
  createdTime: Date;
  updatedTime: Date;
}

const FileResourceSchema: Schema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  url: { type: String },
  bucket: { type: String, required: true },
  userId: { type: String }, // Can be ObjectId if strictly referenced
  type: { type: String },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IFileResource>("FileResource", FileResourceSchema);
