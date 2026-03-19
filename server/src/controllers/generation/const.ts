/**
 * 根据比例计算宽高，最大边为1024
 * @param ratio 比例字符串，如 '1:1', '16:9', '9:16'
 * @returns { width: number, height: number }
 */
export const calculateDimensions = (ratio?: string): { width: number; height: number } => {
  const MAX_EDGE = 1024;
  
  if (!ratio || !ratio.includes(':')) {
    // 默认 1:1
    return { width: MAX_EDGE, height: MAX_EDGE };
  }

  const [wStr, hStr] = ratio.split(':');
  const wRatio = parseFloat(wStr);
  const hRatio = parseFloat(hStr);

  if (isNaN(wRatio) || isNaN(hRatio) || wRatio <= 0 || hRatio <= 0) {
    return { width: MAX_EDGE, height: MAX_EDGE };
  }

  if (wRatio > hRatio) {
    // 宽 > 高，宽为最大边
    return {
      width: MAX_EDGE,
      height: Math.round((MAX_EDGE / wRatio) * hRatio)
    };
  } else if (hRatio > wRatio) {
    // 高 > 宽，高为最大边
    return {
      width: Math.round((MAX_EDGE / hRatio) * wRatio),
      height: MAX_EDGE
    };
  } else {
    // 1:1
    return { width: MAX_EDGE, height: MAX_EDGE };
  }
};
