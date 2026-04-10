<template>
  <Layouts>
    <view id="square" :class="pageStyle['square-container']">
      <!-- 第一行：筛选模块和banner -->
      <view :class="pageStyle['filter-and-banner']">
        <SquareFilter ref="squareFilterRef" @filter-result="filterResult">
        </SquareFilter>
      </view>

      <!-- 第二行：作品展示内容 -->
      <view :class="pageStyle['works-section']">
        <WaterfallLayout
          :items="currentWorks"
          v-if="currentWorks.length > 0"
        />
        <view :class="pageStyle['empty-info']" v-if="currentWorks.length === 0">
          <view :class="pageStyle['empty-text']">啊喔，你似乎来到了一个空的地方</view>
        </view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import Taro from "@tarojs/taro";
import Layouts from '@/components/Layouts/index.vue';
import SquareFilter from './components/SquareFilter/index.vue';
import WaterfallLayout from './components/WaterfallLayout/index.vue';
import type { IWorkBaseInfo } from './components/WorkCard/const';

import pageStyle from './index.module.less';


const currentWorks = ref<IWorkBaseInfo[]>([]);


const filterResult = (val: IWorkBaseInfo[]) => {
  currentWorks.value = val;
}

const squareFilterRef = ref();

import { useDidShow } from "@tarojs/taro";

useDidShow(() => {
  if (squareFilterRef.value) {
    squareFilterRef.value.refreshData();
  }
});

onMounted(() => {
  const env = Taro.getEnv();
  if (env != Taro.ENV_TYPE.WEB)
    Taro.setTopBarText({
      text: '作品广场'
    })
})

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>

<style lang="less" scoped>
</style>
