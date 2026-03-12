import mongoose, { Schema, Document } from "mongoose";

export interface IPointsRecord extends Document {
  userId: string;
  pointType?: string;
  points: number;
  effectiveTime?: Date;
  expiryDate?: Date;
  level?: string;
  createdTime: Date;
  updatedTime: Date;
}

const PointsRecordSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  pointType: { type: String },
  points: { type: Number, default: 0 },
  effectiveTime: { type: Date },
  expiryDate: { type: Date },
  level: { type: String },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IPointsRecord>("PointsRecord", PointsRecordSchema);
