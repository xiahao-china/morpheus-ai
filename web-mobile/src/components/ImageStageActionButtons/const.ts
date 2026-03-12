import type { ESourceType } from '@/api/images/generateImageFeedback.ts';

export interface IImageStageActionButtonsProps {
  currentImage?: {
    id?: string | number;
    url?: string;
    isFavorited?: boolean;
    isCollected: boolean | null;
    workId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  sourceType: ESourceType;
  underImageUrl: string;
  useRelative?: boolean;
  useSendToChangeImage?: boolean; // 是否使用发送到改图
  useRegenerate?: boolean; // 是否使用重新生成
  useLike?: boolean; // 是否使用点赞
  useUnlike?: boolean;
  useCollection?: boolean; // 是否使用收藏
}
