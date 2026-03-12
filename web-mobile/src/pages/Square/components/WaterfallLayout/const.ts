import type { IWorkBaseInfo } from '../WorkCard/const';

// 类型定义
export interface IWaterfallLayoutProps {
  items: IWorkBaseInfo[];
}

export interface IWaterfallColumn {
  items: IWorkBaseInfo[];
  indexMap: number[];
}

// 常量定义
export const WATERFALL_CONSTANTS = {
  COLUMN_GAP: '24rpx',
  ITEM_MARGIN_BOTTOM: '32rpx',
  ITEM_BORDER_RADIUS: '16rpx',
  ITEM_SHADOW: '0 4rpx 12rpx rgba(0, 0, 0, 0.1)',
} as const;

// 静态工具函数
export class WaterfallUtils {
  /**
   * 分布数据到左右两列
   * @param items 要分布的数据项
   * @returns 左右两列的数据和索引映射
   */
  static distributeItemsToColumns(items: IWorkBaseInfo[]): {
    leftColumn: IWaterfallColumn;
    rightColumn: IWaterfallColumn;
  } {
    const leftColumn: IWaterfallColumn = { items: [], indexMap: [] };
    const rightColumn: IWaterfallColumn = { items: [], indexMap: [] };

    if (!items || items.length === 0) {
      return { leftColumn, rightColumn };
    }

    // 简化的分布逻辑：交替分配到左右两列
    // 这样可以确保基本的平衡，避免复杂的高度计算
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (i % 2 === 0) {
        // 偶数索引放左列
        leftColumn.items.push(item);
        leftColumn.indexMap.push(i);
      } else {
        // 奇数索引放右列
        rightColumn.items.push(item);
        rightColumn.indexMap.push(i);
      }
    }

    return { leftColumn, rightColumn };
  }

  /**
   * 重置列数据
   * @returns 空的左右列数据
   */
  static resetColumns(): {
    leftColumn: IWaterfallColumn;
    rightColumn: IWaterfallColumn;
  } {
    return {
      leftColumn: { items: [], indexMap: [] },
      rightColumn: { items: [], indexMap: [] }
    };
  }
}
