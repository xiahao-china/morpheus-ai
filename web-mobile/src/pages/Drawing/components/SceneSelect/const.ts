import { STATIC_ASSETS_URL } from '@/constants';
import Taro from '@tarojs/taro'

export interface ISelectOption {
  id: string;
  name: string;
  image: string;
}

export const SCENE_TITLE = '选择场景';

export const SCENE_OPTIONS: ISelectOption[] = [
  { id: 'living-room', name: '客厅', image: `${STATIC_ASSETS_URL}/drawing/scene-living-room.png` },
  { id: 'bedroom', name: '卧室', image: `${STATIC_ASSETS_URL}/drawing/scene-bedroom.png` },
  { id: 'kitchen', name: '厨房', image: `${STATIC_ASSETS_URL}/drawing/scene-kitchen.png` },
  { id: 'bathroom', name: '卫生间', image: `${STATIC_ASSETS_URL}/drawing/scene-bathroom.png` },
  { id: 'tea-room', name: '茶室', image: `${STATIC_ASSETS_URL}/drawing/scene-tea-room.png` },
];

export const getSceneById = (id: string): ISelectOption | undefined => {
  return SCENE_OPTIONS.find((o) => o.id === id);
};


export class CenterSelectManager {
  private containerId: string = ''
  private itemSelector: string = ''
  private onCenterChange: ((index: number) => void) | null = null
  private scrollCallback: ((scrollLeft: number) => void) | null = null

  constructor(containerId: string, itemSelector: string, onCenterChange?: (index: number) => void, scrollCallback?: (scrollLeft: number) => void) {
    this.containerId = containerId
    this.itemSelector = itemSelector
    this.onCenterChange = onCenterChange || null
    this.scrollCallback = scrollCallback || null
  }

  init() {
    const q = Taro.createSelectorQuery()
    q.select(this.containerId).boundingClientRect()
    q.exec(() => {})
  }

  updateCenter() {
    const q = Taro.createSelectorQuery()
    q.select(this.containerId).boundingClientRect()
    q.select(this.containerId).scrollOffset()
    q.selectAll(`${this.containerId} ${this.itemSelector}`).boundingClientRect()
    q.exec((res) => {
      const containerRect = res?.[0]
      const itemRects = res?.[2] || []
      if (!containerRect || !itemRects?.length) return
      const cw = Number.isFinite(containerRect.width) ? containerRect.width : Math.abs((containerRect.right || 0) - (containerRect.left || 0))
      const containerCenter = containerRect.left + cw / 2
      let closestIdx = 0
      let minDist = Number.MAX_VALUE
      for (let i = 0; i < itemRects.length; i++) {
        const r = itemRects[i]
        const iw = Number.isFinite(r.width) ? r.width : Math.abs((r.right || 0) - (r.left || 0))
        const itemCenter = r.left + iw / 2
        const dist = Math.abs(itemCenter - containerCenter)
        if (dist < minDist) {
          minDist = dist
          closestIdx = i
        }
      }
      if (this.onCenterChange) this.onCenterChange(closestIdx)
    })
  }

  scrollToIndex(index: number) {
    const q = Taro.createSelectorQuery()
    q.select(this.containerId).boundingClientRect()
    q.select(this.containerId).scrollOffset()
    q.selectAll(`${this.containerId} ${this.itemSelector}`).boundingClientRect()
    q.exec((res) => {
      const containerRect = res?.[0]
      const scrollMeta = res?.[1] || {}
      let itemRects = res?.[2] || []
      if (!containerRect || !itemRects?.length) return
      const target = itemRects[index]
      if (!target) return
      const containerWidth = Number.isFinite(containerRect.width) ? containerRect.width : Math.abs((containerRect.right || 0) - (containerRect.left || 0))
      const containerCenter = containerRect.left + containerWidth / 2
      const iw = Number.isFinite(target.width) ? target.width : Math.abs((target.right || 0) - (target.left || 0))
      const itemCenter = target.left + iw / 2
      const delta = itemCenter - containerCenter
      const currentScrollLeft = scrollMeta?.scrollLeft || 0
      const aimScrollLeft = Math.max(0, currentScrollLeft + delta)
      if (this.scrollCallback) this.scrollCallback(aimScrollLeft)
    })
  }
}

export interface ISceneSelectExpose {
  scrollToIndex: (index: number) => void;
  reset: () => void;
}
