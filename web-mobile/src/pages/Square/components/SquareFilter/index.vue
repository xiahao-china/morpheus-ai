<template>
  <view :class="pageStyle['filter-container']">
    <!-- 上方筛选项区域 -->
    <view :class="pageStyle['filter-options']">
      <!-- 搜索框 -->
      <view :class="pageStyle['search-container']" @click="openSearchPopup">
        <Search :class="pageStyle['search-icon']"></Search>
        <view :class="pageStyle['search-placeholder']">{{ keyword || "搜索灵感作品..." }}</view>
      </view>
      <!--
      <view :class="pageStyle['filter-options-popover']">
        ...
      </view>
      -->

      <!-- 标签筛选 -->
<!--      <view :class="pageStyle['filter-section']">-->
<!--        <view :class="pageStyle['left-arrow-btn']" @click="handleArrowClick('left')">-->
<!--          <RectLeft></RectLeft>-->
<!--        </view>-->
<!--        <scroll-view-->
<!--          id="square-tag-list"-->
<!--          :class="pageStyle['button-group']"-->
<!--          :enhanced="true"-->
<!--          :scroll-x="true"-->
<!--          :scroll-with-animation="true"-->
<!--          :show-scrollbar="false"-->
<!--          :scroll-left="scrollLeft"-->
<!--          @binddragging="handleScroll"-->
<!--        >-->
<!--          <view-->
<!--            v-for="item in spaceOptions"-->
<!--            :key="item.value"-->
<!--            class="square-tag-item"-->
<!--            :class="[pageStyle['filter-button'], { [pageStyle['is-active']]: activeSpace?.value === item.value }]"-->
<!--            @click="handleSpaceChange(item)"-->
<!--          >-->
<!--            {{ item.label }}-->
<!--          </view>-->
<!--        </scroll-view>-->
<!--        <view :class="pageStyle['right-arrow-btn']" @click="handleArrowClick('right')">-->
<!--          <RectRight></RectRight>-->
<!--        </view>-->
<!--      </view>-->
    </view>
  </view>
  <SearchPopup
    :visible="showSearchPopup"
    :keyword="keyword"
    :scene="activeSpace?.label || ''"
    :scene-options="spaceOptions.map((item) => item.label)"
    @close="closeSearchPopup"
    @submit="handleSearchByPopup"
  />
  <Loading :visible="loading" text="LOADING" />
</template>

<script setup lang="ts">
import { ref, defineEmits, onMounted, onUnmounted, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import { Toast } from '@nutui/nutui-taro'
import {Search} from "@nutui/icons-vue-taro";
import {ScrollInfo} from "@/util/scrollInfo";
import type { IWorkBaseInfo } from '@/pages/Square/components/WorkCard/const'
import { getSquareList } from '@/api/square/listSquare';
import { getTags } from '@/api/square/getTags';
import {
  DEFAULT_SPACE_OPTIONS,
  type ISortItem,
  mergeWorks,
  PAGE_SIZE,
  TagListManager
} from './const';
import pageStyle from './index.module.less';
import Loading from '@/components/Loading/index.vue';
import {debounce} from "@tarojs/runtime";
import SearchPopup from "@/pages/Square/components/SearchPopup/index.vue";


let tagListManager:TagListManager|null = null;
let scrollInfo: ScrollInfo | null = null;

// 定义事件发射
const emit = defineEmits<{
  filterResult: [IWorkBaseInfo[]]
}>();

const spaceOptions = ref<ISortItem[]>(DEFAULT_SPACE_OPTIONS);
// 响应式状态
const activeSort = ref<ISortItem>({ label: '最新发布', value: 'publishedTime', name: '最新发布' });
const activeSpace = ref<ISortItem>();
const keyword = ref('');
const showSearchPopup = ref(false);

const scrollLeft = ref(0);

const pageNum = ref(0)
const loading = ref(false)
const loadEnd = ref(false)
const currentWorksList = ref<IWorkBaseInfo[]>([])


const handleSearch = async (noRefresh?: boolean) => {
  if (loading.value) return
  if (!noRefresh) {
    pageNum.value = 0
    currentWorksList.value = []
    loadEnd.value = false
  }
  pageNum.value++;
  loading.value = true;
  const response = await getSquareList({
    keyword: keyword.value,
    sceneTags: activeSpace.value?.label,
    sortBy: activeSort.value.value,
    page: pageNum.value,
    pageSize: PAGE_SIZE
  });
  loading.value = false;
  if (response instanceof Error || response.code !== 200) {
    console.error('Error fetching history:', response);
    Toast.text('获取作品列表失败');
    return;
  }
  if (!response.data.list.length) {
    loadEnd.value = true;
  }
  const list = mergeWorks(currentWorksList.value, response.data.list);
  currentWorksList.value = list;
  emit('filterResult', list);
};

// 处理空间分类变更
const handleSpaceChange = (value: ISortItem) => {
  if (activeSpace.value?.label===value.label) {
    activeSpace.value = undefined;
  }else {
    activeSpace.value = value;
  }
  handleSearch();
};

const openSearchPopup = () => {
  showSearchPopup.value = true;
}

const closeSearchPopup = () => {
  showSearchPopup.value = false;
}

const handleSearchByPopup = (payload: { keyword: string; scene: string }) => {
  keyword.value = payload.keyword;
  activeSpace.value = spaceOptions.value.find((item) => item.label === payload.scene);
  showSearchPopup.value = false;
  handleSearch();
}

const handleScrollBottom = debounce(async () => {
  if (!scrollInfo) return;
  if (loadEnd.value) return
  const isBottom = await scrollInfo.isScrollBottom(200);
  isBottom && handleSearch(true);
}, 300)

const initSpaceOptions = async () => {
  const response = await getTags();
  if (response instanceof Error || response.code!== 200) {
    console.log(response);
    Toast.text('获取标签列表失败');
    return {
      styleTags: [],
      sceneTags: [],
    };
  }
  const sceneTags:ISortItem[] = response.data.sceneTags.filter((item)=>item.isEnabled).map((tag) => ({
    value: tag.id.toString(),
    label: tag.name,
  }));
  spaceOptions.value = sceneTags;
}

const handleScroll = (e: any) => {
  // 更新当前滚动位置
  if (tagListManager) {
    tagListManager.updateCurrentScrollLeft(e.detail.scrollLeft);
  }
}

const handleArrowClick = (direction: 'left' | 'right') => {
  if (direction === 'left') {
    tagListManager && (tagListManager?.handleLeftArrowClick());
  } else {
    tagListManager && (tagListManager?.handleRightArrowClick());
  }
}

const refreshData = () => {
  handleSearch();
};

defineExpose({
  refreshData
});

onMounted(() => {
  handleSearch();
  initSpaceOptions();
  const query = Taro.createSelectorQuery()
  query
    .select('#app')
    .boundingClientRect()
    .exec((res) => {
      console.log(res)
    })
  nextTick(() => {
    // 传入滚动回调函数来更新 scrollLeft
    tagListManager = new TagListManager('#square-tag-list', (newScrollLeft: number) => {
      scrollLeft.value = newScrollLeft;
    });
    setTimeout(()=>{
      tagListManager && tagListManager.initPageInfo();
    }, 300)
  });
  scrollInfo = new ScrollInfo('#square');
})

Taro.usePageScroll(handleScrollBottom);

onUnmounted(() => {
  tagListManager && tagListManager.destroy();
})

</script>

<style lang="less" >

</style>
