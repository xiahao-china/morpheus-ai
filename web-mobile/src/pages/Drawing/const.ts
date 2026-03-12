import {SCENE_OPTIONS} from "@/pages/Drawing/components/SceneSelect/const";
import {STYLE_OPTIONS} from "@/pages/Drawing/components/StyleSelect/const";

export enum EGenerateType {
  text,
  line,
  hardcover,
  roughcast
}

export interface IDrawingProps {
  scene: string;
  style: string;
  imgId: string;
  imgUrl: string;
  prompt: string;
  width: number;
  height: number;
}

export const DEFAULT_DRAWING_PROPS: IDrawingProps = {
  scene: SCENE_OPTIONS[0].name,
  style: STYLE_OPTIONS[0].name,
  imgId: '',
  imgUrl: '',
  prompt: '',
  width: 0,
  height: 0,
}

export const calcTaskRatio = (w: number, h: number): string => {
  const iw = Math.abs(Math.floor(w || 0));
  const ih = Math.abs(Math.floor(h || 0));
  if (!iw || !ih) return '1:1';
  let a = iw;
  let b = ih;
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  const g = a || 1;
  return `${Math.round(iw / g)}:${Math.round(ih / g)}`;
}

