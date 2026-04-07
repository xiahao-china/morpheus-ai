import type { IWorkBaseInfo } from '@/pages/Square/components/WorkCard/const'
import type { ISquareItem } from '@/api/square/listSquare';
import { DEFAULT_USER_INFO } from '@/components/HistoryDetail/components/UserAndWorkInfo/const';
import {ActionSheetMenuItems} from "@nutui/nutui-taro/dist/types/__VUE/actionsheet/index.taro.vue";
import Taro from "@tarojs/taro";
import {ACTIVE_COLOR} from "@/constants";
import { makeUrlAbsolute } from '@/util/url';

export interface ISortItem extends ActionSheetMenuItems{
  label: string;
  value: string;
}

export const PAGE_SIZE = 10;

// 大分类选项
export const CATEGORY_OPTIONS: ISortItem[] = [
  { label: '社区广场', value: 'community', name: '社区广场', color: ACTIVE_COLOR },
  { label: '我的小组', value: 'myGroups', name: '我的小组', disable: true }
]

// 排序方式选项
export const SORT_OPTIONS: ISortItem[] = [
  { label: '最新发布', value: 'publishedTime', name: '最新发布', color: ACTIVE_COLOR },
  { label: '最受欢迎', value: 'collectCount', name: '最受欢迎' }
]

// 空间分类选项
export const DEFAULT_SPACE_OPTIONS: ISortItem[] = [
  { label: '办公室', value: 'office', name: '办公室' },
  { label: '大堂', value: 'lobby', name: '大堂' },
  { label: '前台', value: 'reception', name: '前台' },
  { label: '会议室', value: 'meetingRoom', name: '会议室' },
  { label: '公共办公室', value: 'publicOffice', name: '公共办公室' },
  { label: '董事长办公室', value: 'ceoOffice', name: '董事长办公室' },
  { label: '茶水间', value: 'pantry', name: '茶水间' },
  { label: '休息区', value: 'lounge', name: '休息区' },
  { label: '办公走廊', value: 'officeCorridor', name: '办公走廊' },
  { label: '阳台', value: 'balcony', name: '阳台' },
  { label: '餐厅', value: 'restaurant', name: '餐厅' },
  { label: '商场中庭', value: 'mallAtrium', name: '商场中庭' },
  { label: '书店', value: 'bookstore', name: '书店' },
  { label: '展厅', value: 'exhibitionHall', name: '展厅' },
  { label: '厂房', value: 'factory', name: '厂房' },
  { label: '操作间', value: 'operationRoom', name: '操作间' },
  { label: '其他', value: 'other', name: '其他' }
]


export const mergeWorks = (currentWorksList: IWorkBaseInfo[], newWorksList: ISquareItem[]): IWorkBaseInfo[] => {
  const handleResList = newWorksList.map((item) => ({
    workId: item._id,
    workImg: makeUrlAbsolute(item.imageUrl || ''),
    avatar: makeUrlAbsolute(item.avatar || DEFAULT_USER_INFO.avatar),
    name: item.username || DEFAULT_USER_INFO.username,
    likeCount: item.likeCount || item.collectCount || 0,
    hasLike: false,
    title: item.title,
  }))
  return [...currentWorksList, ...handleResList];
}

export class TagListManager {
  private containerElId: string = '';
  private pageWidth: number = 0;
  private totalPages: number = 0;
  private currentPage: number = 0;
  // 页面监听是否已注册
  private hasInitPageListener: boolean = false;
  // 是否正在滚动
  private isScrolling: boolean = false;
  // 滚动回调函数
  private scrollCallback: ((scrollLeft: number) => void) | null = null;

  constructor(container: string, scrollCallback?: (scrollLeft: number) => void) {
    this.containerElId = container;
    this.scrollCallback = scrollCallback || null;
  }

  handleResize(): void {
    this.initPageInfo();
  }

  async scrollToPage(page: number) {
    if (!this.containerElId) return;
    this.isScrolling = true;

    const aimScrollLeft = (page - 1) * this.pageWidth;
    console.log('scrollToPage:', { page, aimScrollLeft, pageWidth: this.pageWidth });

    // 使用回调函数通知 Vue 组件更新 scrollLeft
    if (this.scrollCallback) {
      this.scrollCallback(aimScrollLeft);
    }

    // 简单的延迟来模拟滚动完成
    await new Promise(resolve => {
      setTimeout(() => {
        this.isScrolling = false;
        resolve(true);
      }, 300);
    });
  }

  updateCurrentScrollLeft(scrollLeft: number) {
    // 根据滚动位置计算当前页面
    this.currentPage = Math.floor(scrollLeft / this.pageWidth) + 1;
  }

  initPageInfo() {
    if (!this.containerElId) return;
    const elQuery = Taro.createSelectorQuery();
    elQuery.select(this.containerElId).boundingClientRect();
    // 获取子节点宽度
    elQuery.selectAll(`${this.containerElId} > .square-tag-item`).boundingClientRect();
    elQuery.exec((res) => {
      if (res[0]) {
        this.pageWidth = res[0].width;
        const scrollWidth = res[1].reduce((a, b) => a + b.width, 0);
        this.totalPages = Math.ceil(scrollWidth / this.pageWidth);
        console.log('pageWidth:', scrollWidth, this.pageWidth, this.totalPages);
        this.currentPage = 1;
        if (!this.hasInitPageListener) {
          window.addEventListener('resize', this.handleResize);
          this.hasInitPageListener = true;
        }
      }
    })
  }

  destroy() {
    if (this.hasInitPageListener) {
      window.removeEventListener('resize', this.handleResize);
      this.hasInitPageListener = false;
    }
  }

  handleLeftArrowClick(): void {
    if (!this.containerElId || this.isScrolling) return;
    if (this.currentPage <= 1){
      Taro.showToast({
        title: '前面没有更多了',
        icon: 'none'
      });
      return;
    }
    this.currentPage--;
    this.scrollToPage(this.currentPage);
  }

  handleRightArrowClick(): void {
    if ( !this.containerElId || this.isScrolling) return;
    console.log('handleRightArrowClick:', { currentPage: this.currentPage, totalPages: this.totalPages });
    if (this.currentPage >= this.totalPages){
      Taro.showToast({
        title: '后面没有更多了',
        icon: 'none'
      });
      return;
    }
    this.currentPage++;
    this.scrollToPage(this.currentPage);
  }

}
