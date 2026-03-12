import {STATIC_ASSETS_URL} from "@/constants";

export const DEFAULT_UPLOAD_BG_IMAGE = `${STATIC_ASSETS_URL}/drawing/uploadbg.png`;
export const DRAWING_MAX_IMAGE_SIZE = 1024;

export const multipleOfEight = (n: number) => {
  if (!n || n <= 0) return 8;
  return Math.max(8, Math.floor(n / 8) * 8);
};

export const calcScaledSizeByWH = (
  width: number,
  height: number,
  max = DRAWING_MAX_IMAGE_SIZE,
) => {
  if (!width || !height) return { width: 0, height: 0 };
  const scale = Math.min(max / width, max / height, 1);
  const w = multipleOfEight(Math.floor(width * scale));
  const h = multipleOfEight(Math.floor(height * scale));
  return { width: w, height: h };
};
