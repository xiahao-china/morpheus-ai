<template>
  <view :class="pageStyle['waterfall-container']">
    <!-- 左列 -->
    <view :class="pageStyle['waterfall-column']" ref="leftColumnRef">
      <view
        :class="pageStyle['waterfall-item']"
        v-for="item in leftColumn"
        :key="item.workId"
      >
        <WorkCard
          :info="item"
          @click-img="(detail) => handleWorkCardClick(detail)"
          @collect="() => handleCollect(item)"
          @img-load="(calcImgHeight) => handleImgLoad(calcImgHeight, item)"
        />
      </view>
    </view>

    <!-- 右列 -->
    <view :class="pageStyle['waterfall-column']" ref="rightColumnRef">
      <view
        :class="pageStyle['waterfall-item']"
        v-for="item in rightColumn"
        :key="item.workId"
      >
        <WorkCard
          :info="item"
          @click-img="(detail) => handleWorkCardClick(detail)"
          @collect="() => handleCollect(item)"
          @img-load="(calcImgHeight) => handleImgLoad(calcImgHeight, item)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import type { IWorkBaseInfo } from "@/pages/Square/components/WorkCard/const";
import { throttle } from "@/constants/util";
import { getWorkInfo } from "@/pages/Square/const";
import Taro from "@tarojs/taro";
import { cloneDeep } from "@/util/cloneDeep";
import pageStyle from "./index.module.less";
import WorkCard from "../WorkCard/index.vue";

import { type IWaterfallLayoutProps } from "./const";

const props = defineProps<IWaterfallLayoutProps>();

// 左右两列的数据
const leftColumn = ref<(IWorkBaseInfo & { calcImgHeight?: number })[]>([]);
const rightColumn = ref<(IWorkBaseInfo & { calcImgHeight?: number })[]>([]);
// 内部处理项
const innerItems = ref<(IWorkBaseInfo & { calcImgHeight?: number })[]>([]);

// 显示详情页面
const showDetails = (workId: string) => {
  // 导航到详情页面，传递作品ID
  Taro.navigateTo({
    url: `/packageHistory/pages/HistoryDetailPage/index?id=${workId}&type=square`,
    events: {
      likeStatusChange: () => {
        const item = innerItems.value.find((item) => item.workId === workId);
        handleCollect(item);
      }
    }
  });
};

// 分布数据到左右两列
const distributeItems = throttle(() => {
  // 对现在的列表进行操作
  let leftHeightCur = 0; // 左边列表的高度
  let rightHeightCur = 0;
  const hasCalcList = innerItems.value.filter(
    (item) => item.calcImgHeight !== undefined
  );
  const left: (IWorkBaseInfo & { calcImgHeight?: number })[] = []; // 左边列表的数组
  const right: (IWorkBaseInfo & { calcImgHeight?: number })[] = [];
  // 遍历数组
  for (let i = 0; i < hasCalcList.length; i++) {
    if (leftHeightCur <= rightHeightCur) {
      left.push(hasCalcList[i]);
      leftHeightCur =
        leftHeightCur +
        (hasCalcList[i] as IWorkBaseInfo & { calcImgHeight: number })
          .calcImgHeight;
    } else {
      right.push(hasCalcList[i]);
      rightHeightCur =
        rightHeightCur +
        (hasCalcList[i] as IWorkBaseInfo & { calcImgHeight: number })
          .calcImgHeight;
    }
  }

  const otherList = innerItems.value.filter(item => item.calcImgHeight === undefined);
  otherList.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
    } else {
      right.push(item);
    }
  })
  // 赋值
  leftColumn.value = cloneDeep(left);
  rightColumn.value = cloneDeep(right);
}, 300);

// 监听 props.items 变化
watch(
  () => props.items,
  () => {
    innerItems.value = props.items;
    distributeItems();
  },
  { immediate: true }
);

const handleImgLoad = (calcImgHeight: number, itemInfo: IWorkBaseInfo) => {
  const findItemIndex = innerItems.value.findIndex(
    (item) => item.workId === itemInfo.workId
  );
  if (findItemIndex !== -1) {
    innerItems.value[findItemIndex].calcImgHeight = calcImgHeight;
  }
  // 重新分布数据
  distributeItems();
};

// 处理 WorkCard 点击事件
const handleWorkCardClick = (workId: string) => {
  showDetails(workId);
};

const handleCollect = async (item?: IWorkBaseInfo) => {
  if (!item) return;
  const leftIndex = leftColumn.value.findIndex(work => work.workId.toString() === (item?.workId?.toString() ));
  const rightIndex = rightColumn.value.findIndex(work => work.workId.toString() === (item?.workId?.toString() ));
  const itemIndex = innerItems.value.findIndex(work => work.workId.toString() === (item?.workId?.toString()));

  if (leftIndex > -1) {
    const aimItem = leftColumn.value[leftIndex];
    const info = await getWorkInfo(aimItem.workId);
    if (info){
      leftColumn.value[leftIndex] = {
        ...info,
        calcImgHeight: aimItem.calcImgHeight,
      };
      innerItems.value[itemIndex] = {
        ...info,
        calcImgHeight: aimItem.calcImgHeight,
      };
    }

  } else if (rightIndex > -1) {
    const aimItem = rightColumn.value[rightIndex];
    const info = await getWorkInfo(aimItem.workId);
    if (info){
      rightColumn.value[rightIndex] = {
        ...info,
        calcImgHeight: aimItem.calcImgHeight,
      };
      innerItems.value[itemIndex] = {
        ...info,
        calcImgHeight: aimItem.calcImgHeight,
      };
    }
  }
};
</script>
