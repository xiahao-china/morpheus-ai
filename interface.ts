/**
 * interface.ts
 * 
 * This file contains TypeScript interfaces representing the data model for the application.
 * Based on the existing Java entity classes.
 * 
 * Tech Stack: MongoDB + Redis + Node.js
 */

// ==========================================
// Enums
// ==========================================

export enum UserRoleEnum {
  USER = 'USER', // 普通用户
  ADMIN = 'ADMIN' // 管理员
}

export enum UserStatusEnum {
  INACTIVE = 0, // 未激活
  ACTIVE = 1 // 已激活
}

export enum TaskStatusEnum {
  INITIATED = 'INITIATED', // 初始化
  PENDING = 'PENDING', // 等待中
  PROCESSING = 'PROCESSING', // 处理中
  COMPLETED = 'COMPLETED', // 已完成
  CANCEL = 'CANCEL', // 取消
  FAILED = 'FAILED' // 失败
}

export enum MessageCategoryEnum {
  SYSTEM = 'SYSTEM', // 系统通知
  ACTIVITY = 'ACTIVITY', // 活动通知
  MEMBER = 'MEMBER', // 会员权益
  ANNOUNCEMENT = 'ANNOUNCEMENT', // 官方公告
  TASK = 'TASK' // 设计任务
}

export enum MessageStatusEnum {
  DRAFT = 'DRAFT', // 草稿
  PENDING_REVIEW = 'PENDING_REVIEW', // 待审核
  APPROVED = 'APPROVED', // 审核通过
  SENT = 'SENT', // 已发送
  RECALLED = 'RECALLED' // 已撤回
}

export enum AuditStatusEnum {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已上架
  REJECTED = 2 // 已下架
}

export enum ImageActionModeEnum {
  DRAWING = 'DRAWING', // 绘图模式
  RENDER = 'RENDER', // 旧_渲染模式
  INSPIRATION = 'INSPIRATION', // 灵感生图
  MAKE_UP = 'MAKE_UP', // 毛坯精装
  REHABILITATION = 'REHABILITATION', // 实景改造
  RENDER_LY = 'RENDER_LY', // 一键渲染
  LINEAR_RENDER = 'LINEAR_RENDER', // 线性渲染
  HOME_MIGRATION = 'HOME_MIGRATION', // 家具植入
  REDRAW = 'REDRAW', // 局部重绘
  CLEAN = 'CLEAN', // 智能清除
  UPSCALE = 'UPSCALE', // 高清放大
  CUTOUT = 'CUTOUT', // 一键抠图
  OBJECT_MIGRATION = 'OBJECT_MIGRATION' // 万物迁移
}

export enum PackageTypeEnum {
  MEMBERSHIP = 'MEMBERSHIP', // 会员套餐
  POINTS = 'POINTS' // 积分包
}

export enum UserPointTypeEnum {
  DAILY_POINTS = 'DAILY_POINTS', // 每日登入获得
  EVENT_POINTS = 'EVENT_POINTS', // 参加积分活动获得
  WEEKLY_LIMITED_POINTS = 'WEEKLY_LIMITED_POINTS', // 充值试用版会员
  ACTIVATION_CODE = 'ACTIVATION_CODE', // 激活码
  RECHARGE_STANDARD_MEMBER = 'RECHARGE_STANDARD_MEMBER', // 充值标准版会员
  RECHARGE_PROFESSIONAL_MEMBER = 'RECHARGE_PROFESSIONAL_MEMBER', // 充值专业版会员
  RECHARGE_PREMIUM_MEMBER = 'RECHARGE_PREMIUM_MEMBER', // 充值尊享版会员
  RECHARGE_POINTS_PACKAGE = 'RECHARGE_POINTS_PACKAGE' // 积分包
}

// ==========================================
// 1. User & Authentication (登录注册)
// ==========================================

/**
 * 用户实体
 * 对应表：user
 */
export interface User {
  _id?: string; // MongoDB主键ID
  username: string; // 用户名
  nickname?: string; // 昵称
  outwardId?: string; // 对外ID
  password?: string; // 密码
  email?: string; // 邮箱
  phone?: string; // 手机号
  avatar?: string; // 头像
  status: UserStatusEnum; // 状态
  role: UserRoleEnum; // 角色
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  personalSignature?: string; // 个性签名
  openid?: string; // 微信OpenID
  appOpenid?: string; // 小程序OpenID
  unionId?: string; // 微信UnionID
  inviteCode?: string; // 邀请码
}

export enum ActivationCodeTypeEnum {
  MEMBERSHIP = 'MEMBERSHIP', // 会员激活码
  POINTS = 'POINTS' // 积分激活码
}

/**
 * 激活码
 * 对应表：activation_code
 */
export interface ActivationCode {
  _id?: string; // MongoDB主键ID
  code: string; // 激活码
  type: ActivationCodeTypeEnum; // 类型
  status: number; // 状态：0=未使用，1=已使用，2=已过期
  duration?: number; // 有效期（天）
  value?: number; // 会员天数或者积分数
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  expireTime?: Date; // 过期时间
}

// ==========================================
// 2. Image Generation (生图任务)
// ==========================================

/**
 * 输入图片配置 (用于底图、参考图、提示图等)
 */
export interface InputImageConfig {
  id?: string; // 关联的图片ID (原 referImageId/underImageId)
  url?: string; // 图片URL
  name?: string; // 图片名称
  extractionLevel?: number; // 提取强度
  extractionLevelOutward?: number; // 对外展示的提取强度
  width?: number; // 图片宽 (特定场景需要)
  height?: number; // 图片高 (特定场景需要)
}

/**
 * 生图业务参数
 */
export interface GenerationParams {
  // --- 基础参数 ---
  prompt: string; // 正向提示词
  negativePrompt?: string; // 反向提示词
  width: number; // 宽
  height: number; // 高
  ratio?: string; // 比例
  count?: number; // 生成数量
  promptUsage?: string; // 提示词用途

  // --- 模型相关 ---
  model: string; // 主模型名称
  modelId?: string; // 主模型ID
  modelOutwardName?: string; // 主模型对外名称
  
  styleModel?: string; // 风格模型
  styleModelId?: string; // 风格模型ID
  styleModelOutwardName?: string; // 风格模型对外名称
  styleExtractionLevel?: number; // 风格提取强度
  styleExtractionLevelOutward?: number; // 对外展示的风格提取强度

  // --- 输入图片资源 (结构化) ---
  promptImage?: InputImageConfig; // 提示图
  negativePromptImage?: InputImageConfig; // 反向提示图
  underImage?: InputImageConfig; // 底图 (包含 width/height)
  referImage?: InputImageConfig; // 参考图
}

/**
 * ComfyUI 引擎配置
 */
export interface ComfyUIConfig {
  workflowJson?: string; // 工作流JSON
  workflowName?: string; // 工作流名称
  promptId?: string; // ComfyUI任务ID (原 comfyuiPromptId)
  clientId?: string; // ComfyUI客户端ID (原 comfyuiClientId)
  seed?: number; // 随机种子
}

/**
 * 生图任务 (主文档)
 * 对应表：image_generation
 */
export interface ImageGeneration {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  
  // --- 任务状态与类型 ---
  status: TaskStatusEnum; // 任务状态
  type?: ImageActionModeEnum; // 任务类型
  
  // --- 分组配置 ---
  params: GenerationParams; // 业务参数
  comfyui: ComfyUIConfig; // 引擎配置

  // --- 时间信息 ---
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  startedTime?: Date; // 开始时间
  completedTime?: Date; // 完成时间

  // --- 结果 ---
  // 对应 Java 中的虚字段，在 NoSQL 中可嵌套或引用
  images?: GeneratedImage[]; // 生成的图片列表
}

/**
 * 生成的图片结果
 * 对应表：generated_image
 */
export interface GeneratedImage {
  _id?: string; // MongoDB主键ID
  userId?: string; // 关联用户ID
  imageGenerationId: string; // 关联的生图任务ID
  fileResourceId: string; // 关联文件资源ID
  imageUrl: string; // 图片URL
  width: number; // 宽
  height: number; // 高
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

// ==========================================
// 3. Task Scheduling & Rewards (任务调度, 完成奖励任务)
// ==========================================

export enum TaskTypeEnum {
  DAILY_SIGN_IN = 1, // 每日签到
  SHARE_TASK = 2, // 分享任务
  PURCHASE_TASK = 3, // 购买任务
  INVITE_TASK = 4, // 邀请任务
  PROFILE_TASK = 5 // 资料完善
}

/**
 * Activity Task Configuration (活动任务配置)
 * Corresponds to 'task_config' table
 */
export interface ActivityTaskConfig {
  _id?: string; // MongoDB主键ID
  taskName: string; // 任务名称
  taskType: TaskTypeEnum; // 任务类型
  activityCode?: string; // 关联活动编码
  eventType?: string; // 监听事件类型
  description?: string; // 任务描述
  taskRule?: string; // 任务规则配置(JSON)
  conditionType?: string; // 条件类型：ONCE-一次 DAILY-每日 WEEKLY-每周 MONTH-每月 YEAR-每年
  maxCompletion?: number; // 最大完成次数
  rewardConfig?: string; // 奖励配置(JSON)
  preTaskIds?: string; // 前置任务ID (原 preTaskCodes)
  sortOrder?: number; // 排序
  status?: number; // 状态：1-启用 0-禁用
  createdBy?: string; // 创建人
  createdTime: Date; // 创建时间
  updatedBy?: string; // 更新人
  updatedTime: Date; // 更新时间
  isDeleted?: number; // 是否删除
}

/**
 * 用户任务记录
 * 对应表：user_task_record
 */
export interface UserTaskRecord {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  taskCode: string; // 任务编码
  activityCode?: string; // 活动编码
  completionCount?: number; // 完成次数
  currentProgress?: string; // 当前进度
  lastCompletionTime?: Date; // 最后完成时间
  nextResetTime?: Date; // 下次重置时间
  totalReward?: number; // 累计获得奖励
  status?: number; // 状态：1-进行中 2-已完成 3-已过期
  completionDate?: string; // 完成日期
  extraData?: string; // 扩展数据
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}

/**
 * 任务完成日志
 * 对应表：task_completion_log
 */
export interface TaskCompletionLog {
  _id?: string; // MongoDB主键ID
  logNo?: string; // 日志流水号
  userId: string; // 关联用户ID
  taskCode?: string; // 任务编码
  activityCode?: string; // 活动编码
  eventId?: string; // 触发事件ID
  eventType?: string; // 事件类型
  completionTime?: Date; // 完成时间
  completionChannel?: string; // 完成渠道
  deviceId?: string; // 设备ID
  ipAddress?: string; // IP地址
  progressData?: string; // 进度数据快照
  rewardAmount?: number; // 奖励金额
  rewardType?: string; // 奖励类型
  rewardStatus?: number; // 奖励发放状态
  status?: number; // 处理状态：1-成功，2-规则验证失败，3-奖励发放失败
  failReason?: string; // 失败原因
  processingDuration?: number; // 处理耗时
  ruleResults?: string; // 规则验证结果(JSON)
  rewardResults?: string; // 奖励发放结果(JSON)
  riskLevel?: number; // 风险等级：0-正常 1-低风险 2-高风险
  riskReason?: string; // 风险原因
  operator?: string; // 操作人
  remark?: string; // 备注
  createdTime?: Date; // 创建时间
}

// ==========================================
// 4. Message & SMS (发送短信)
// ==========================================

/**
 * 消息通知
 * 对应表：message
 */
export interface Message {
  _id?: string; // MongoDB主键ID
  title?: string; // 标题
  content?: string; // 内容
  type?: MessageCategoryEnum; // 消息类型
  status?: MessageStatusEnum; // 消息状态
  publishedTime?: Date; // 发布时间
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  targetAudience?: string; // 目标人群
}

/**
 * 用户消息状态对象
 */
export interface MessageStatus {
  messageId: string; // 关联消息ID
  isRead: boolean; // 是否已读
  readTime?: Date; // 阅读时间
  receivedTime?: Date; // 接收/推送时间
}

/**
 * 用户消息关联表 (聚合存储)
 * 对应表：message_user
 * 说明：MongoDB中可以将一个用户的所有消息状态存储在一个文档中，或者按月分桶存储
 */
export interface MessageUser {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  messages: MessageStatus[]; // 消息列表
  updatedTime?: Date; // 最后更新时间
}

// ==========================================
// 5. Community & Collections (收藏, 发布)
// ==========================================

/**
 * 广场发布 (社区帖子)
 * 对应表：square
 */
export interface Square {
  _id?: string; // MongoDB主键ID
  userId: string; // 发布人ID (关联用户)
  title?: string; // 标题
  caption?: string; // 文案
  styleTags?: string[]; // 风格标签
  sceneTags?: string[]; // 场景标签
  drawTaskInfo?: ImageGeneration; // 绘图任务信息
  editedTaskInfo?: any; // 改图任务信息
  publishedTime?: Date; // 发布时间
  updateTime?: Date; // 更新时间
  auditStatus?: AuditStatusEnum; // 审核状态
  isOfficialRecommend?: boolean; // 是否官方推荐
  recommendTime?: Date; // 推荐时间
  viewCount?: number; // 浏览量
  likeCount?: number; // 点赞量
  collectCount?: number; // 收藏量
}

/**
 * 用户发布记录 (聚合存储 - 可选)
 * 用于快速获取用户发布列表，或者直接在 Square 表通过 userId 查询
 */
export interface UserPublishRecord {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  squareIds: string[]; // 已发布的帖子ID列表
  updatedTime: Date; // 最后更新时间
}

/**
 * 收藏项详情
 */
export interface CollectItem {
  squareId: string; // 关联广场ID
  imageId?: string; // 关联图片ID (可选，若针对特定图片收藏)
  collectedTime: Date; // 收藏时间
}

/**
 * 广场收藏 (收藏夹 - 聚合存储)
 * 对应表：square_collect
 * 说明：一个用户一个文档，存储所有收藏的帖子ID
 */
export interface SquareCollect {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  collections: CollectItem[]; // 收藏列表
  updatedTime: Date; // 最后更新时间
}

/**
 * 广场图片
 * 对应表：square_image
 */
export interface SquareImage {
  _id?: string; // MongoDB主键ID
  squareId: string; // 关联广场ID
  userId: string; // 关联用户ID
  imageId: string; // 关联图片ID
  fileResourceId?: string; // 关联文件资源ID
  imageUrl?: string; // 图片URL
  type?: ImageActionModeEnum; // 图片类型
}

// ==========================================
// 6. Membership (开通会员)
// ==========================================

/**
 * 会员套餐
 * 对应表：membership_package
 */
export interface MembershipPackage {
  _id?: string; // MongoDB主键ID
  name?: string; // 套餐名称
  cycleType?: string; // 周期类型
  level?: string; // 等级
  price?: number; // 价格
  coins?: number; // 推敲币
  description?: string; // 描述
  isEnabled?: boolean; // 是否启用
  createdTime?: Date; // 创建时间
  updatedTime?: Date; // 更新时间
  levelSort?: number; // 排序
  validMonths?: number; // 有效月数
  packageType?: PackageTypeEnum; // 套餐类型
}

/**
 * 会员订单
 * 对应表：membership_order
 */
export interface MembershipOrder {
  _id?: string; // MongoDB主键ID (订单ID)
  userId: string; // 关联用户ID
  packageId?: string; // 关联套餐ID
  totalAmount?: number; // 总金额
  currency?: string; // 币种
  orderStatus?: string; // 订单状态
  expireTime?: Date; // 过期时间
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  wxCodeUrl?: string; // 微信二维码
  qrCodeUrl?: string; // 支付宝二维码
  prepayId?: string; // 预支付ID
  channel?: string; // 渠道
}

/**
 * 会员权益
 * 对应表：member_benefits
 */
export interface MemberBenefits {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  packageId: string; // 关联套餐ID
  effectiveTime: Date; // 生效时间
  expirationTime: Date; // 过期时间
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  level?: string; // 等级
  membershipOrderId?: string; // 关联订单ID
}

// ==========================================
// 7. Points & Rewards (领取积分)
// ==========================================

/**
 * 积分记录 (用户积分余额)
 * 对应表：points_record
 */
export interface PointsRecord {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  pointType?: UserPointTypeEnum; // 积分类型
  points?: number; // 积分数值
  effectiveTime?: Date; // 生效时间
  expiryDate?: Date; // 失效时间
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
  level?: string; // 会员等级
}

/**
 * 积分详情 (历史记录)
 * 对应表：points_detail
 */
export interface PointsDetail {
  _id?: string; // MongoDB主键ID
  userId: string; // 关联用户ID
  imageGenerationId?: string; // 关联绘图任务ID
  imageEditedId?: string; // 关联改图任务ID
  description?: string; // 描述
  pointsAmount?: number; // 变动数额
  createdTime: Date; // 创建时间
  pointsDirection?: boolean; // 方向：true=增加，false=减少
  expiryDate?: Date; // 失效时间
}

/**
 * 奖励记录
 * 对应表：reward_record
 */
export interface RewardRecord {
  _id?: string; // MongoDB主键ID
  rewardNo?: string; // 奖励流水号
  userId: string; // 关联用户ID
  recipientUserId?: string; // 受益人ID
  rewardType?: string; // 奖励类型：POINTS-积分，COUPON-优惠券，CASH-现金
  rewardAmount?: number; // 奖励数额
  actualAmount?: number; // 实际发放数额
  currency?: string; // 币种
  activityId?: string; // 关联活动ID
  activityCode?: string; // 活动编码
  taskCode?: string; // 任务编码
  relatedEventId?: string; // 关联事件ID
  rewardId?: string; // 关联奖励ID
  rewardStatus?: number; // 奖励状态：1-待发放，2-已发放，3-发放失败，4-已撤销
  failReason?: string; // 失败原因
  distributedTime?: Date; // 发放时间
  grantStatus?: number; // 发放状态：0-待发放 1-发放中 2-已发放 3-发放失败
  grantTime?: Date; // 发放时间
  retryCount?: number; // 重试次数
  nextRetryTime?: Date; // 下次重试时间
  remark?: string; // 备注
  extraData?: string; // 扩展数据
  createdTime: Date; // 创建时间
  updatedTime: Date; // 更新时间
}
