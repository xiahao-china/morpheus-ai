export interface IImageContrastProps {
  originImageUrl: string;
  contrastImageUrl: string;
  canUseLeftArrow?: boolean;
  canUseRightArrow?: boolean;
}
export interface IImageContrastExpose {
  changeShowContrast: (show: boolean) => void;
}
