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
  username: { type: String, required: true, unique: true }, // 用户名
  nickname: { type: String }, // 昵称
  outwardId: { type: String }, // 外部ID
  password: { type: String }, // 密码
  email: { type: String }, // 邮箱
  phone: { type: String }, // 手机号
  avatar: { type: String }, // 头像
  status: { type: Number, enum: [UserStatusEnum.INACTIVE, UserStatusEnum.ACTIVE], default: UserStatusEnum.ACTIVE }, // 用户状态
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }, // 用户角色
  createdTime: { type: Date, default: Date.now }, // 创建时间
  updatedTime: { type: Date, default: Date.now }, // 更新时间
  personalSignature: { type: String }, // 个人签名
  openid: { type: String }, // 微信openid
  appOpenid: { type: String }, // App openid
  unionId: { type: String }, // 微信unionid
  inviteCode: { type: String } // 邀请码
});

export default mongoose.model<IUser>('User', UserSchema);
