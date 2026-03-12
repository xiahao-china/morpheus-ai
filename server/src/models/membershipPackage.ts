import mongoose, { Schema, Document } from "mongoose";

export interface IMembershipPackage extends Document {
  name: string;
  cycleType: string;
  level: string;
  price: number;
  coins: number;
  description: string;
  isEnabled: boolean;
  levelSort: number;
  validMonths: number;
  packageType: string;
  createdTime: Date;
  updatedTime: Date;
}

const MembershipPackageSchema: Schema = new Schema({
  name: { type: String, required: true },
  cycleType: { type: String },
  level: { type: String },
  price: { type: Number },
  coins: { type: Number },
  description: { type: String },
  isEnabled: { type: Boolean, default: true },
  levelSort: { type: Number },
  validMonths: { type: Number },
  packageType: { type: String },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IMembershipPackage>("MembershipPackage", MembershipPackageSchema);
