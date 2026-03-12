const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1], [1, 0], [1, 1],
];
// 最大中断距离
const MAX_INTERRUPT_DISTANCE = 30;

/**
 * 计算两点之间的欧几里得距离
 * @param point1 第一个点，格式为 [x, y]
 * @param point2 第二个点，格式为 [x, y]
 * @returns 两点之间的距离
 */
function distance(point1: number[], point2: number[]): number {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 根据点之间的距离重新排序点位结果
 * @param points 点位数组，格式为 [[x1, y1], [x2, y2], ...]
 * @returns 重新排序后的点位数组
 */
function reorderPoints(points: number[][]): number[][] {
  if (points.length === 0) return [];

  const result: number[][] = [];
  const unvisited = new Set<number>(Array.from({ length: points.length }, (_, i) => i));

  // 选择第一个点作为起始点
  let currentIndex = 0;
  result.push(points[currentIndex]);
  unvisited.delete(currentIndex);

  while (unvisited.size > 0) {
    let minDistance = Infinity;
    let nextIndex = -1;

    // 寻找距离当前点最近的未访问点
    unvisited.forEach((index) => {
      const dist = distance(points[currentIndex], points[index]);
      if (dist < minDistance) {
        minDistance = dist;
        nextIndex = index;
      }
    });

    if (nextIndex !== -1) {
      result.push(points[nextIndex]);
      unvisited.delete(nextIndex);
      currentIndex = nextIndex;
    }
  }

  return result;
}

/**
 * 以起始点为中心，向外放射500个点，直到找到与起始点颜色不一致的点或者到达边缘
 * @param imageData 图像数据
 * @param startX 起始点的 x 坐标
 * @param startY 起始点的 y 坐标
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 找到的与起始点颜色不一致的点或者到达边缘的点的数组
 */
function radiatePoints(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
): number[][] {
  const startColor = getPixelColor(imageData, startX, startY, width, height);
  const result: number[][] = [];
  const maxPoints = 800;

  // 计算每个方向的角度间隔
  const angleStep = (2 * Math.PI) / maxPoints;

  for (let i = 0; i < maxPoints; i++) {
    const angle = i * angleStep;
    let distance = 1;

    while (true) {
      const newX = startX + Math.round(distance * Math.cos(angle));
      const newY = startY + Math.round(distance * Math.sin(angle));

      // 检查是否到达边缘
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
        result.push([newX, newY]);
        break;
      }

      const currentColor = getPixelColor(imageData, newX, newY, width, height);
      // 检查颜色是否不一致
      if (!isSameColor(currentColor, startColor)) {
        result.push([newX, newY]);
        break;
      }

      distance++;
    }
  }

  return result;
}

// 获取指定坐标的像素颜色
function getPixelColor(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): number[] {
  if (x < 0 || x >= width || y < 0 || y >= height) return [-1, -1, -1, -1];
  // 计算像素在 ImageData 中的索引
  const index = (y * width + x) * 4;
  // 从 ImageData 中提取像素数据
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
    imageData.data[index + 3]
  ];
}

// 判断两个颜色是否相同
function isSameColor(color1: number[], color2: number[]): boolean {
  return color1.every((value, index) => value === color2[index]);
}
// 判断是否为边缘点
function isBorderPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  imageData: ImageData,
  startColor: number[]
): boolean {
  const currentColor = getPixelColor(imageData, x, y, width, height);
  if (!isSameColor(currentColor, startColor)) return true;
  for (const [dx, dy] of DIRECTIONS) {
    const newX = x + dx;
    const newY = y + dy;
    if (newX < 0 || newX > width || newY < 0 || newY > height) continue;
    if (newX === 0 || newX === width || newY === 0 || newY === height){
      return true;
    }
    const neighborColor = getPixelColor(imageData, newX, newY, width, height);
    if (!isSameColor(neighborColor, startColor)) return true;
  }
  return false;
}


function filterSpikePoints(points: number[][]): number[][] {
  if (points.length < 3) return points;

  // 获取所有点的平均连续距离
  const distances: number[] = [];
  const len = points.length;
  for (let i = 0; i < len; i++) {
    if (!points[i+1]) break;
    distances.push(distance(points[i], points[i+1]));
  }
  const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / len;

  // 获取所有所有超平均距离两倍的点的索引
  const spikePoints: [number,number][] = [];
  let curPointsAry:number[] = [];
  for (let i = 0; i < len; i++) {
    if (distances[i] > averageDistance * 2) {
      if (curPointsAry.length === 2) {
        spikePoints.push(curPointsAry as [number,number]);
        curPointsAry = [];
      }
      curPointsAry.push(i);
    }
  }


  const resAryPoints: number[][] = [];
  let preIndex = 0;
  spikePoints.forEach((point: [number, number]) => {
    if (point[1] - point[0] < 8) {
      resAryPoints.push(...points.slice(preIndex,point[0] - 1));
    }else {
      resAryPoints.push(...points.slice(preIndex,point[1] + 1));
    }
    preIndex = point[1] + 1;
  })

  return resAryPoints;
}

// 从指定点位向外查找边缘并返回边缘点数组
function findBorderPoints(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
): number[][] {
  const visited = new Set<string>();
  const borderPoints: number[][] = [];
  const startColor = getPixelColor(imageData, startX, startY, width, height);

  const waitCheck: [number, number][] = [[startX, startY]];
  visited.add(`${startX},${startY}`);

  while (waitCheck.length){
    const item = waitCheck.shift();
    if (!item) continue;
    const [x, y] = item;

    if (isBorderPoint(x, y, width, height, imageData, startColor)) {
      borderPoints.push([x, y]);
    } else {
      for (const [dx, dy] of DIRECTIONS) {
        const newX = x + dx;
        const newY = y + dy;
        const key = `${newX},${newY}`;
        if (visited.has(key)) continue;
        if (newX < 0 || newX > width || newY < 0 || newY > height) continue;

        visited.add(key);
        waitCheck.push([newX, newY]);
      }
    }
  }

  return borderPoints;
}

self.onmessage = function (e) {
  const { imageData, startX, startY, width, height } = e.data;
  const borderPoints = findBorderPoints(imageData, startX, startY, width, height);
  const handlePoints = reorderPoints(borderPoints);
  // 检测是否有点超过最大中断距离
  let isInterrupt = false;
  for (let i = 0; i < handlePoints.length; i++) {
    const point = handlePoints[i];
    const nextPoint = handlePoints[(i + 1) % handlePoints.length];
    if (distance(point, nextPoint) > MAX_INTERRUPT_DISTANCE) {
      isInterrupt = true;
      break;
    }
  }
  if (isInterrupt) {
    let radiatedPoints = radiatePoints(imageData, startX, startY, width, height);
    radiatedPoints = filterSpikePoints(radiatedPoints);
    self.postMessage(radiatedPoints);
    return;
  }
  self.postMessage(handlePoints);
};

