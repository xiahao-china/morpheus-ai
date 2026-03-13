import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: string;
  orderNo: string;
  tradeNo?: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  paymentMethod: 'ALIPAY' | 'WECHAT';
  packageId?: string; // If buying a membership package
  points?: number; // If buying points directly (if applicable)
  description?: string;
  createdTime: Date;
  updatedTime: Date;
  payTime?: Date;
}

const OrderSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  orderNo: { type: String, required: true, unique: true },
  tradeNo: { type: String },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['ALIPAY', 'WECHAT'], 
    required: true 
  },
  packageId: { type: String },
  points: { type: Number },
  description: { type: String },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now },
  payTime: { type: Date }
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IOrder>("Order", OrderSchema);
