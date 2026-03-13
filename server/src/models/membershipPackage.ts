import mongoose, { Schema, Document } from "mongoose";

export interface IMembershipPackage extends Document {
  name: string; // 套餐名称
  cycleType: string; // 周期类型
  level: string; // 等级
  price: number; // 价格
  coins: number; // 金币数量
  description: string; // 描述
  isEnabled: boolean; // 是否启用
  levelSort: number; // 等级排序
  validMonths: number; // 有效月数
  packageType: string; // 套餐类型
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

const MembershipPackageSchema: Schema = new Schema({
  name: { type: String, required: true }, // 套餐名称
  cycleType: { type: String }, // 周期类型
  level: { type: String }, // 等级
  price: { type: Number }, // 价格
  coins: { type: Number }, // 金币数量
  description: { type: String }, // 描述
  isEnabled: { type: Boolean, default: true }, // 是否启用
  levelSort: { type: Number }, // 等级排序
  validMonths: { type: Number }, // 有效月数
  packageType: { type: String }, // 套餐类型
  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' }
});

export default mongoose.model<IMembershipPackage>("MembershipPackage", MembershipPackageSchema);