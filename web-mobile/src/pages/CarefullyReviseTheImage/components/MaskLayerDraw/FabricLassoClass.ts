import { fabric } from 'fabric'
import type { Point } from 'fabric/fabric-impl'
import type { IObject } from '@/constants/types.ts';

export enum ELassoType {
  LASSO = 'lasso',
  LASSO_ERASER = 'lassoEraser',
}

export interface IFabricLassoClassProps {
  canvas: fabric.Canvas
  canvasShellEl: HTMLElement
  scale: number
}

export const LASSO_BASE_CONFIG = {
  fill: 'rgba(45, 92, 242, 1.0)',
  stroke: 'rgba(45, 92, 242, 1.0)',
  strokeWidth: 2,
  objectCaching: false,
  transparentCorners: false,
  selectable: false,
}

export const LASSO_ERASER_BASE_CONFIG = {
  ...LASSO_BASE_CONFIG,
  fill: 'rgb(253,223,196)',
  stroke: 'rgb(253,223,196)',
}

function polygonToErasePath(polygon: fabric.Polygon, originCanvas: fabric.Canvas, width:number, height:number) {
  // 1. 创建离屏 canvas
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const ctx = offCanvas.getContext('2d');
  if (!ctx) return '';

  // 2. 在 Fabric 的 context 上绘制 polygon
  ctx.save();
  polygon.render(ctx);
  ctx.restore();

  // 3. 获取像素数据
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const originImgData = originCanvas.getContext().getImageData(0, 0, width, height).data;

  // 4. 生成 path 字符串
  let path = '';
  let started = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = imgData[idx + 3]; // 透明度
      const originAlpha = originImgData[idx + 3];
      if (alpha > 0 && originAlpha > 0) { // 非透明像素
        if (!started) {
          path += `M ${x} ${y}`;
          started = true;
        } else {
          path += ` L ${x} ${y}`;
        }
      }
    }
  }

  return path;
}

export default class FabricLassoClass {
  // 最小结束距离，用于判断是否结束绘制，即在距离最开始点位小于这个距离时结束绘制
  private static MIN_END_DISTANCE = 5
  // 定义画布和画布元素
  private canvas: fabric.Canvas
  private canvasShellEl: HTMLElement
  // 定义绘制状态
  private isActive = false
  private isDrawing = false
  // 获取放大倍率
  private scale = 1

  private currentPolygon: fabric.Polygon | null = null
  // 已绘制的点
  private drawedPoints: Point[] = []
  // 正在绘制的点
  private drawingPoints: Point | null = null
  private preShortcutKeys: GlobalEventHandlers['onkeydown'] | null = null

  private lassoType: ELassoType = ELassoType.LASSO

  // 回调列表, 绘制完成时的回调
  public onEndDrawHandle: (()=>void)[] = []

  constructor(props: IFabricLassoClassProps) {
    this.canvas = props.canvas
    this.canvasShellEl = props.canvasShellEl
    this.scale = props.scale
  }

  handleDblclick() {
    if (this.isActive && this.isDrawing) {
      this.endDraw();
    }
  }

  drawingStarthandle(event: MouseEvent) {
    const { canvas, isActive, canvasShellEl, scale } = this
    event.stopPropagation() // 阻止默认事件发生
    const drawingRectangle = canvasShellEl.getBoundingClientRect()
    const point: Point = new fabric.Point(
      (event.clientX - drawingRectangle.left)/scale,
      (event.clientY - drawingRectangle.top)/scale,
    )

    this.isActive = true
    this.isDrawing = true
    // 开始绘制
    if (!isActive) {
      this.drawedPoints = [point];
      console.log('开始绘制',canvas)

      // canvas.defaultCursor = 'poniter' // 改变鼠标形状
      this.currentPolygon = new fabric.Polygon(this.drawedPoints, {
        ...(this.lassoType === ELassoType.LASSO ? LASSO_BASE_CONFIG : LASSO_ERASER_BASE_CONFIG),
        left: point.x,
        top: point.y,
      })
      canvas.add(this.currentPolygon);
      return
    } else {
      if (this.drawingPoints && this.currentPolygon) {
        this.drawedPoints.push(this.drawingPoints)
        this.drawingPoints = null
        this.currentPolygon.set('points', this.drawedPoints)
      }
    }
    canvas.renderAll()
    // 判断是否结束
    if (
      this.drawedPoints.length > 0 &&
      point.distanceFrom(this.drawedPoints[0]) < FabricLassoClass.MIN_END_DISTANCE
    ) {
      this.endDraw()
      canvas.renderAll()
    }
  }

  drawinghandle(event: MouseEvent) {
    const { canvasShellEl, isActive, isDrawing, scale, canvas } = this
    if (isActive && isDrawing) {
      event.stopPropagation()
      const drawingRectangle = canvasShellEl.getBoundingClientRect()
      requestAnimationFrame(() => {
        if (!this.currentPolygon) return
        const point: Point = new fabric.Point(
          (event.clientX - drawingRectangle.left)/scale,
          (event.clientY - drawingRectangle.top)/scale,
        )
        if (point.distanceFrom(this.drawedPoints[0]) < FabricLassoClass.MIN_END_DISTANCE){
          canvas.defaultCursor = 'pointer';
        }else {
          canvas.defaultCursor = 'default';
        }
        this.drawingPoints = point
        this.currentPolygon.set('points', [...this.drawedPoints, point])
        canvas.renderAll()
      })
    }
  }

  addShortcutKeys(e: KeyboardEvent) {
    // 回退到上一个点
    if (e.key === 'z' && e.ctrlKey) {
      if (this.drawedPoints.length > 0) {
        this.drawedPoints.pop()
        this.currentPolygon?.set('points', this.drawedPoints)
        this.canvas.renderAll()
      }
    }
    if (e.key === 'Escape') {
      this.cancelDraw()
    }
  }

  private onMousedown = this.drawingStarthandle.bind(this)
  private onMousemove = this.drawinghandle.bind(this)
  private onDbclick = this.handleDblclick.bind(this)

  startDraw() {
    const { canvasShellEl, onMousedown, onMousemove, addShortcutKeys, onDbclick } = this
    // 监听鼠标点击事件
    canvasShellEl.addEventListener('mousedown', onMousedown)
    // 监听鼠标移动事件
    canvasShellEl.addEventListener('mousemove', onMousemove)
    // 监听双击事件
    canvasShellEl.addEventListener('dblclick', onDbclick);
    this.preShortcutKeys = document.onkeydown
    document.onkeydown = (ev) => {
      addShortcutKeys.apply(this, [ev])
    }
  }

  cancelDraw() {
    this.isActive = false
    this.isDrawing = false
    this.drawingPoints = null
    this.drawedPoints = []
    if (this.currentPolygon) {
      this.canvas.remove(this.currentPolygon)
      this.currentPolygon = null
      this.canvas.renderAll()
    }
  }

  updateLassoType(type: ELassoType) {
    this.lassoType = type
  }

  endDraw() {
    if (this.currentPolygon && this.currentPolygon.points) {
      this.canvas.remove(this.currentPolygon);
      this.canvas.renderAll();
      const path = new fabric.Polygon(this.currentPolygon.points, {
        ...(this.lassoType === ELassoType.LASSO ? LASSO_BASE_CONFIG : LASSO_ERASER_BASE_CONFIG),
      });

      if (this.lassoType === ELassoType.LASSO_ERASER) {
        const brush = new (fabric as IObject).EraserBrush(this.canvas);
        brush.width = 3;
        const pixels = polygonToErasePath(path, this.canvas, this.canvas.width || 0, this.canvas.height || 0);
        const brushPath = brush.createPath(pixels);
        brushPath.selectable = false;
        this.canvas.add(brushPath);
      }else {
        this.canvas.add(path);
      }
      this.canvas.renderAll();
      this.currentPolygon = null
    }

    this.isActive = false
    this.isDrawing = false
    this.drawingPoints = null
    this.drawedPoints = []
    this.onEndDrawHandle.forEach((handle) => {
      handle()
    })
  }

  // 套索退出时，取消快捷键及绘制事件
  exitLasso() {
    const { canvasShellEl, onMousedown, onMousemove, onDbclick } = this
    canvasShellEl.removeEventListener('mousedown', onMousedown)
    canvasShellEl.removeEventListener('mousemove', onMousemove)
    canvasShellEl.removeEventListener('dblclick', onDbclick);
    document.onkeydown = this.preShortcutKeys
    this.preShortcutKeys = null
  }
}
