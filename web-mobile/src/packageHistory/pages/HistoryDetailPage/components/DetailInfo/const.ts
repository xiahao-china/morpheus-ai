import dayjs from 'dayjs';
import {
  EFunctionGroupMode,
  FUNCTION_GROUP_MODE_MAP,
} from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const';
import { DEFAULT_SCENE_MODELS } from '@/pages/CarefullyReviseTheImage/components/ChoseScene/const';
import { SCALE_TYPE_RADIO_GROUP } from '@/pages/CarefullyReviseTheImage/components/ScaleType/const';
import type { IHistoryTaskInfo } from '@/components/HistoryDetail/const';

export enum EPublishStatus {
  published = 'published',
  unpublish = 'unpublish',
  auditing = 'auditing',
}

export const PUBLISH_STATUS_INFO_MAP = {
  [EPublishStatus.published]: {
    label: '已发布',
    optionLabel: '取消发布',
    color: 'success',
  },
  [EPublishStatus.unpublish]: {
    label: '未发布',
    optionLabel: '发布作品',
    color: 'danger',
  },
  [EPublishStatus.auditing]: {
    label: '审核中',
    optionLabel: '取消发布',
    color: 'primary',
  },
};

export interface IHistoryDetailInfoProps {
  taskInfo: IHistoryTaskInfo;
  onlyShowOneImg?: boolean;
  publishInfo: ISquarePublishInfo;
}

export interface ITaskDetailInfoItem {
  title: string;
  text?: string;
  imgUrl?: string;
  none?: boolean;
}

export interface ITaskDetailInfo {
  model: string;
  time: string;
  listInfo: ITaskDetailInfoItem[];
}

export const getListInfoByType = (taskInfo: IHistoryTaskInfo) => {
  const listInfo: ITaskDetailInfoItem[] = [];
  console.log(taskInfo);
  switch (taskInfo.type) {
    case EFunctionGroupMode.ONE_KEY_RENDER:
      listInfo.push(
        {
          title: '渲染原图',
          imgUrl: taskInfo.underImageUrl,
          none: !taskInfo.underImageUrl,
        },
        {
          title: '场景模型',
          text: DEFAULT_SCENE_MODELS.find((item) => item.id === taskInfo.scene)?.name,
          none: !taskInfo.scene,
        },
        {
          title: '风格模型',
          text: taskInfo.styleModelOutwardName || '没有风格模型哦~',
          none: !taskInfo.styleModelOutwardName,
        },
        {
          title: '提示词',
          text: taskInfo.prompt,
        },
      );
      break;
    case EFunctionGroupMode.LOCAL_REDRAW:
      listInfo.push(
        {
          title: '重绘原图',
          imgUrl: taskInfo.underImageUrl,
          none: !taskInfo.underImageUrl,
        },
        {
          title: '风格设置',
          text: '默认风格',
        },
        {
          title: '提示词',
          text: taskInfo.prompt,
        },
      );
      break;
    case EFunctionGroupMode.INTELLIGENT_CLEAR:
      listInfo.push(
        {
          title: '原图',
          imgUrl: taskInfo.underImageUrl,
          none: !taskInfo.underImageUrl,
        },
      );
      break;
    case EFunctionGroupMode.HIGH_DEF_ENLARGE:
      listInfo.push(
        {
          title: '原图',
          imgUrl: taskInfo.underImageUrl,
          none: !taskInfo.underImageUrl,
        },
        {
          title: '放大类型',
          text: SCALE_TYPE_RADIO_GROUP.find((item) => item.value === taskInfo.enlargeTyped)?.label,
        },
        {
          title: '放大倍率',
          text: `${taskInfo.width} x ${taskInfo.height} —— ${taskInfo.width * (taskInfo.magnificationOutward as number)} X ${taskInfo.height * (taskInfo.magnificationOutward as number)} (${taskInfo.magnificationOutward}倍)`,
        },
      );
      break;
    case EFunctionGroupMode.ONE_KEY_CUTOUT:
      listInfo.push(
        {
          title: '原图',
          imgUrl: taskInfo.underImageUrl,
          none: !taskInfo.underImageUrl,
        },
        {
          title: '物品提示词',
          text: taskInfo.prompt,
        },
      );
      break;
      case EFunctionGroupMode.ALL_THINGS_TRANSFER:
        listInfo.push(
          {
            title: '背景图',
            imgUrl: taskInfo.underImageUrl,
            none: !taskInfo.underImageUrl,
          },
        );
        break;
    case EFunctionGroupMode.DRAWING:
    default:
      listInfo.push(
        {
          title: '基础模型',
          text: taskInfo.modelOutwardName || '没有基础模型哦~',
        },
        {
          title: '风格模型',
          text: taskInfo.styleModelOutwardName || '没有风格模型哦~',
          none: !taskInfo.styleModelOutwardName,
        },
        {
          title: '提示词',
          text: taskInfo.prompt,
        },
        {
          title: '反向提示词',
          text: taskInfo.negativePrompt || '没有反向提示词哦~',
          none: !taskInfo.negativePrompt,
        },
        {
          title: '底图',
          imgUrl: taskInfo.underImageUrl,
          text: taskInfo.underImageUrl ? undefined : '本次绘图没有底图哦~',
          none: !taskInfo.underImageUrl,
        },
        {
          title: '参考图',
          imgUrl: taskInfo.referImageUrl,
          text: taskInfo.referImageUrl ? undefined : '本次绘图没有参考图哦~',
          none: !taskInfo.referImageUrl,
        },
      );
      break;
  }
  return listInfo;
};

export const handleDetailInfo = (taskInfo?: IHistoryTaskInfo): ITaskDetailInfo => {
  if (!taskInfo)
    return {
      model: '',
      time: '',
      listInfo: [],
    };
  return {
    model: FUNCTION_GROUP_MODE_MAP[taskInfo.type]?.label || '绘图模式',
    time: dayjs(taskInfo.completedTime).format('YYYY/MM/DD HH:mm:ss'),
    listInfo: getListInfoByType(taskInfo),
  };
};

export interface ISquarePublishInfo {
  showPublishBtn: boolean;
  publishStatus: EPublishStatus;
  isFromWorks: boolean;
  isCollected: boolean | null;
}

export const DEFAULT_PUBLISH_INFO: ISquarePublishInfo = {
  showPublishBtn: true,
  publishStatus: EPublishStatus.unpublish,
  isFromWorks: false,
  isCollected: null,
}
