import { STATIC_ASSETS_URL } from '@/constants';
import Taro from '@tarojs/taro'

export interface ISelectOption {
  id: string;
  name: string;
  image: string;
}

export const STYLE_TITLE = '设计风格';

export const STYLE_OPTIONS: ISelectOption[] = [
  { id: 'modern', name: '现代风格', image: `${STATIC_ASSETS_URL}/drawing/style-modern.png` },
  { id: 'light-luxury', name: '轻奢风格', image: `${STATIC_ASSETS_URL}/drawing/style-light-luxury.png` },
  { id: 'minimalist', name: '极简主义', image: `${STATIC_ASSETS_URL}/drawing/style-minimalist.png` },
  { id: 'industrial', name: '工业风格', image: `${STATIC_ASSETS_URL}/drawing/style-industrial.png` },
  { id: 'cream', name: '奶油风格', image: `${STATIC_ASSETS_URL}/drawing/style-cream.png` },
  { id: 'french', name: '法式风格', image: `${STATIC_ASSETS_URL}/drawing/style-french.png` },
  { id: 'vintage', name: '复古风格', image: `${STATIC_ASSETS_URL}/drawing/style-vintage.png` },
  { id: 'modern-chinese', name: '新中式', image: `${STATIC_ASSETS_URL}/drawing/style-modern-chinese.png` },
  { id: 'natural-wood', name: '原木风格', image: `${STATIC_ASSETS_URL}/drawing/style-natural-wood.png` },
  { id: 'simple', name: '简约风格', image: `${STATIC_ASSETS_URL}/drawing/style-simple.png` },
];

export const getStyleById = (id: string): ISelectOption | undefined => {
  return STYLE_OPTIONS.find((o) => o.id === id);
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
      const containerWidth = Number.isFinite(containerRect.width) ? containerRect.width : Math.abs((containerRect.right || 0) - (containerRect.left || 0))
      const containerCenter = containerRect.left + containerWidth / 2
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
      const itemRects = res?.[2] || []
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
  
  centerByIndex(index: number) {
    const q = Taro.createSelectorQuery()
    q.select(this.containerId).boundingClientRect()
    q.select(this.containerId).scrollOffset()
    q.selectAll(`${this.containerId} ${this.itemSelector}`).fields({ rect: true, size: true })
    q.exec((res) => {
      const containerRect = res?.[0]
      const scrollMeta = res?.[1] || {}
      const items = res?.[2] || []
      if (!containerRect || !items?.length) return
      const target = items[index]
      if (!target) return
      const containerWidth = Number.isFinite(containerRect.width) ? containerRect.width : Math.abs((containerRect.right || 0) - (containerRect.left || 0))
      const containerCenter = containerRect.left + containerWidth / 2
      const iw = Number.isFinite(target.width) ? target.width : Math.abs((target.right || 0) - (target.left || 0))
      const itemCenter = target.left + iw / 2
      const delta = itemCenter - containerCenter
      const currentScrollLeft = scrollMeta?.scrollLeft || 0
      const aimScrollLeft = Math.max(0, currentScrollLeft + delta)
      if (this.scrollCallback) this.scrollCallback(aimScrollLeft)
      if (this.onCenterChange) this.onCenterChange(index)
    })
  }
}

export interface IStyleSelectExpose {
  getSelectedStyle: () => ISelectOption | null
  reset: () => void
}
