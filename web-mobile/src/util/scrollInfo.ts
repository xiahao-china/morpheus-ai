import Taro from "@tarojs/taro";
import {isArray} from "@tarojs/shared";

interface ScrollMeta {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export class ScrollInfo {
  private scrollTop: number = 0;
  private scrollHeight: number = 0;
  private clientHeight: number = 0;
  private containerElId: string = '';

  constructor(containerElId: string) {
    this.containerElId = containerElId;
    this.clientHeight = Taro.getSystemInfoSync().windowHeight;
  }

  public getScrollInfo(): ScrollMeta {
    return {
      scrollTop: this.scrollTop,
      scrollHeight: this.scrollHeight,
      clientHeight: this.clientHeight,
    };
  }

  public async updateScrollInfo() {
    if (!this.containerElId) {
      return;
    }
    this.clientHeight === 0 && (this.clientHeight = Taro.getSystemInfoSync().windowHeight);
    await Promise.all([new Promise((resolve) => {
      Taro.createSelectorQuery()
        .selectViewport()
        .scrollOffset(res => {
          this.scrollTop = res.scrollTop
          resolve(res.scrollTop);
        })
        .exec()
    }), new Promise((resolve) => {
      Taro.createSelectorQuery()
        .select(this.containerElId)
        .boundingClientRect(res => {
          !isArray(res) && (this.scrollHeight = res.height);
          resolve(res)
        })
        .exec()
    })])
  }

  public async isScrollBottom(distance: number, customTop?: number) {
    await this.updateScrollInfo();
    const { scrollTop, clientHeight, scrollHeight } = this.getScrollInfo();
    console.log('scrollTop', (customTop || scrollTop), 'clientHeight', clientHeight, 'scrollHeight', scrollHeight)
    if (!scrollHeight) return false;
    return (customTop || scrollTop) + clientHeight >= scrollHeight - distance;
  }
}

