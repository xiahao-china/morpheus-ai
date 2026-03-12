export interface IWorkBaseInfo {
  workId: string;
  workImg: string;
  title: string;

  avatar: string;
  name: string;
  likeCount: number;

  hasLike?: boolean;
  calcImgHeight?: number;
}

export interface IWorkCardProps {
  info: IWorkBaseInfo;
}

