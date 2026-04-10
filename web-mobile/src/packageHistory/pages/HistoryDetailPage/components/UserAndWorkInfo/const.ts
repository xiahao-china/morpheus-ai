import defaultAvatar from '@/assest/image/default-head-image.png';

export interface UserInfo {
  /** 用户头像URL */
  avatar: string;
  /** 用户昵称 (展示用，对应后端 username) */
  username: string;
  /** 原始昵称 (仅作备份) */
  nickname?: string;
}

export interface WorkInfo {
  /** 作品标题 */
  title: string;
  /** 作品简介 */
  description: string;
  /** 作品更新时间 */
  updateTime: string;
  /** 作品类型 */
  type: string[];
  /** 作品场景标签 */
  scene: string[];
  /** 作品是否收藏 */
  isCollection: boolean;
  /** 作品ID */
  workId: string;
  /** 作品收藏数 */
  collections: number;
}

/** 默认用户信息 */
export const DEFAULT_USER_INFO: UserInfo = {
  // avatar: new URL('@/assest/image/default-head-image.png', import.meta.url).href,
  avatar: defaultAvatar,
  username: '未知用户',
  nickname: '未知用户',
};

/** 默认作品信息 */
export const DEFAULT_WORK_INFO: WorkInfo = {
  title: '未命名作品',
  description: '暂无简介',
  updateTime: '-----',
  type: [],
  scene: [],
  isCollection: false,
  workId: '',
  collections: 0
};
