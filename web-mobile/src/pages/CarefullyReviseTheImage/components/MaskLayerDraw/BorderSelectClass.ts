import { ElMessage } from 'element-plus'
import { once } from '@/constants/util.ts';

import type { IObject } from '@/constants/types.ts';


export interface IBorderSelectClassProps {
  canvas: IObject;
  canvasShellEl: HTMLElement;
  scale: number;
}

const loadOpencv = once(async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = new URL('@/lib/opencv/opencv.js', import.meta.url).href;
    script.onload = () => {
      (window as IObject).cv.onRuntimeInitialized = resolve;
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
});

// 获取边缘检测后的canvas,即二值化然后使用边缘卷积核进行卷积计算得出边缘
export const getBorderCanvas = async (imgUrlStr: string): Promise<HTMLCanvasElement> => {
  const resCanvas = document.createElement('canvas');
  const imgEl = document.createElement('img');
  imgEl.setAttribute('crossorigin', 'anonymous');
  imgEl.src = imgUrlStr;
  const cv = (window as IObject).cv;

  return new Promise((resolve) => {
    imgEl.onload = () => {
      // 读取获取矩阵（步骤1）
      const mat = cv.imread(imgEl);
      // 新建图像矩阵（步骤2,灰度）
      const gray = new cv.Mat();
      // 将图像从一个颜色空间转换到另一个颜色空间（步骤3）
      cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
      // 新建图像矩阵（步骤4，边缘）
      const edges = new cv.Mat();
      // 灰度转为边缘检测（步骤5）
      cv.Canny(gray, edges, 50, 200);
      // 展示边缘检测转化后的图像空间矩阵
      cv.imshow(resCanvas, edges);
      resCanvas.style.position = 'absolute';
      resCanvas.style.top = '0';
      resCanvas.style.left = '0';
      resCanvas.style.zIndex = '-1';
      // 调用delete释放堆的内存
      mat.delete();
      gray.delete();
      edges.delete();
      resolve(resCanvas);
    };
  });
};


// 查找边缘以获取
export const findBorderPoints = async (
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
): Promise<number[][]> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 由于查找边缘算法比较耗时，因此使用worker到其他线程进行计算，避免造成页面卡死问题
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./borderDetection.worker.ts', import.meta.url)
    );

    worker.postMessage({
      imageData,
      startX,
      startY,
      width: canvas.width,
      height: canvas.height,
    });

    worker.onmessage = function (e) {
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = function (error) {
      reject(error);
      worker.terminate();
    };
  });
};

// 边缘选择类，用于选择图片的边缘区域，目前由前端使用边缘算法卷积计算得出
export default class BorderSelectClass {
  private canvas: IObject;
  private canvasShellEl: HTMLElement;
  private scale = 1;

  // 回调列表,
  // 绘制开始时的回调
  public onStartDrawHandle: ((isFile?: boolean) => void)[] = [];
  // 绘制中断时的回调
  public onDrawTerHandle: (() => void)[] = [];
  // 绘制完成时的回调
  public onEndDrawHandle: ((isFile?: boolean) => void)[] = [];

  private waitLoadedOpenCvCallback: (() => void) | null = null;


  // 图片相关参数
  borderCanvas: HTMLCanvasElement | null = null;
  currentImageData: ImageData | null = null;

  constructor(props: IBorderSelectClassProps) {
    this.canvas = props.canvas;
    this.canvasShellEl = props.canvasShellEl;
    this.scale = props.scale;
  }

  // 点击开始边缘选择
  async clickStartBorderSelectHandler(e: MouseEvent) {
    // 获取点击区域
    const {fabric} = window as IObject;
    const { canvas, canvasShellEl, scale } = this;
    const { clientX, clientY } = e;
    const { left, top } = canvasShellEl.getBoundingClientRect();
    const x = parseInt(((clientX - left) / scale).toFixed(0));
    const y = parseInt(((clientY - top) / scale).toFixed(0));
    console.log('点击区域', x, y);
    // 获取当前点位色值，如果是黑色则向外查找边缘，并通过fabric绘制
    if (!this.borderCanvas ) return;
    const ctx = this.borderCanvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imgData.data;
    if (r === 0 && g === 0 && b === 0) {
      try {
        this.onStartDrawHandle.forEach((handle) => handle());
        // 黑色区域，向外查找边缘
        const borderPoints = await findBorderPoints(this.borderCanvas, x, y);
        const handPoints = borderPoints.map(([x, y]) => new fabric.Point(x, y));
        if (borderPoints.length === 0) return;
        // 通过fabric绘制
        const border = new fabric.Polygon(handPoints, {
          fill: 'rgba(224, 245, 255, 0.25)',
          stroke: 'rgba(57,207,255,1.0)',
          strokeWidth: 2,
          objectCaching: false,
          transparentCorners: false,
          selectable: false,
        });
        canvas.add(border);
        canvas.renderAll();
        this.onEndDrawHandle.forEach((handle) => handle());
      } catch (err) {
        console.log('绘制失败', err);
        this.onDrawTerHandle.forEach((handle) => handle());
      }
    }else {
      ElMessage.info('啊噢~这里是边界，请重新选择吧~');
    }
  }

  onClick = this.clickStartBorderSelectHandler.bind(this);

  async loadImage(imgUrl: string) {
    if (!(window as IObject).cv) {
      this.waitLoadedOpenCvCallback = async () => await this.loadImage(imgUrl);
      return;
    }
    console.log('加载图片', imgUrl);
    this.borderCanvas = await getBorderCanvas(imgUrl);
    // this.canvasShellEl.appendChild(this.borderCanvas);
  }

  // 初始化边缘选择
  async init() {
    this.onStartDrawHandle.forEach((handle) => handle(true));
    // 加载opencv作为边缘计算的核心功能
    await loadOpencv();
    this.onEndDrawHandle.forEach((handle) => handle(true));
    if (this.waitLoadedOpenCvCallback) {
      await this.waitLoadedOpenCvCallback();
      this.waitLoadedOpenCvCallback = null;
    }
    const { canvasShellEl, onClick } = this;
    canvasShellEl.addEventListener('click', onClick);
  }

  exitBorderSelect() {
    const { canvasShellEl, onClick } = this;
    canvasShellEl.removeEventListener('click', onClick);
    this.borderCanvas = null;
  }
}
