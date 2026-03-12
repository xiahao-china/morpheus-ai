import mongoose, { Schema, Document } from 'mongoose';

export enum UserRoleEnum {
  USER = 'USER', // 普通用户
  ADMIN = 'ADMIN' // 管理员
}

export enum UserStatusEnum {
  INACTIVE = 0, // 未激活
  ACTIVE = 1 // 已激活
}

export interface IUser extends Document {
  username: string;
  nickname?: string;
  outwardId?: string;
  password?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: UserStatusEnum;
  role: UserRoleEnum;
  createdTime: Date;
  updatedTime: Date;
  personalSignature?: string;
  openid?: string;
  appOpenid?: string;
  unionId?: string;
  inviteCode?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String },
  outwardId: { type: String },
  password: { type: String },
  email: { type: String },
  phone: { type: String },
  avatar: { type: String },
  status: { type: Number, enum: [0, 1], default: 1 },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now },
  personalSignature: { type: String },
  openid: { type: String },
  appOpenid: { type: String },
  unionId: { type: String },
  inviteCode: { type: String }
});

export default mongoose.model<IUser>('User', UserSchema);
