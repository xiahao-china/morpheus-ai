export enum TaskTypeEnum {
  DAILY_SIGN_IN = 1, // 每日签到
  SHARE_TASK = 2,    // 分享任务
  PURCHASE_TASK = 3, // 购买任务
  INVITE_TASK = 4,   // 邀请任务
  PROFILE_TASK = 5   // 完善资料任务
}

export enum TaskFrequencyEnum {
  DAILY = 'DAILY',
  ONCE = 'ONCE'
}

export interface IActiveTaskConfig {
  code: string;
  name: string;
  description: string;
  type: TaskTypeEnum;
  rewardPoints: number;
  targetCount: number;
  frequency: TaskFrequencyEnum;
  icon?: string;
  sort: number;
  isEnabled: boolean;
}

export const ACTIVE_TASKS: IActiveTaskConfig[] = [
  // 每日签到
  {
    code: 'daily_sign_in',
    name: '每日登录奖励',
    description: '每日可领取66推敲币，当日有效',
    type: TaskTypeEnum.DAILY_SIGN_IN,
    rewardPoints: 66,
    targetCount: 1,
    frequency: TaskFrequencyEnum.DAILY,
    sort: 1,
    isEnabled: true
  },
  // 新人报到
  {
    code: 'newcomer_report',
    name: '新人报到',
    description: '已完成注册，立即获得奖励',
    type: TaskTypeEnum.PROFILE_TASK,
    rewardPoints: 100,
    targetCount: 1,
    frequency: TaskFrequencyEnum.ONCE,
    sort: 2,
    isEnabled: true
  },
  // 首次完成生图
  {
    code: 'first_generation',
    name: '首次完成生图',
    description: '体验任意生图模式并生成一张图片',
    type: TaskTypeEnum.PROFILE_TASK, // Temporarily classify as Profile/Growth
    rewardPoints: 50,
    targetCount: 1,
    frequency: TaskFrequencyEnum.ONCE,
    sort: 3,
    isEnabled: true
  },
  // 首次发布作品
  {
    code: 'first_publish',
    name: '首次发布作品',
    description: '将您的作品发布到广场',
    type: TaskTypeEnum.PROFILE_TASK, // Temporarily classify as Profile/Growth
    rewardPoints: 30,
    targetCount: 1,
    frequency: TaskFrequencyEnum.ONCE,
    sort: 4,
    isEnabled: true
  },
  // 填写问卷
  {
    code: 'survey',
    name: '填写问卷',
    description: '帮助我们改进产品体验',
    type: TaskTypeEnum.PROFILE_TASK, // Temporarily classify as Profile/Growth
    rewardPoints: 50,
    targetCount: 1,
    frequency: TaskFrequencyEnum.ONCE,
    sort: 5,
    isEnabled: true
  }
];
