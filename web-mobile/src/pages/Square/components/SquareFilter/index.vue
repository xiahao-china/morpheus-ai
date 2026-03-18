<template>
  <view :class="pageStyle['filter-container']">
    <!-- 上方筛选项区域 -->
    <view :class="pageStyle['filter-options']">
      <!-- 搜索框 -->
      <view :class="pageStyle['search-container']">
        <Search :class="pageStyle['search-icon']"></Search>
        <nut-searchbar
          :class="pageStyle['search-input']"
          v-model="keyword"
          placeholder="输入关键词搜索作品..."
          @search="()=>handleSearch()"
          :max-length="10"
        />
        <nut-button :class="pageStyle['search-btn']">搜索</nut-button>
      </view>

      <view :class="pageStyle['filter-options-popover']">
        <view :class="pageStyle['segment']">
          <view
            :class="[pageStyle['segment-item'], activeCategory.value === 'community' ? pageStyle['segment-item-active'] : '']"
            @click="handleCategoryChange(categoryOptions[0])"
          >
            <IconFont :class="pageStyle['segment-icon']" font-class-name="iconfont" class-prefix="icon" name="sparkles" />
            <view :class="pageStyle['segment-text']">社区广场</view>
          </view>
          <view
            :class="[pageStyle['segment-item'], activeCategory.value === 'myGroups' ? pageStyle['segment-item-active'] : pageStyle['segment-item-disabled']]"
            @click="handleCategoryChange(categoryOptions[1])"
          >
            <IconFont :class="pageStyle['segment-icon']" font-class-name="iconfont" class-prefix="icon" name="user" />
            <view :class="pageStyle['segment-text']">我的小组</view>
          </view>
        </view>

        <view :class="pageStyle['sort-toggles']">
          <view
            :class="[pageStyle['sort-item'], activeSort.value === 'publishedTime' ? pageStyle['sort-item-active'] : '']"
            @click="handleSortChange(sortOptions[0])"
          >
            最新发布
          </view>
          <view :class="pageStyle['sort-divider']"></view>
          <view
            :class="[pageStyle['sort-item'], activeSort.value === 'collectCount' ? pageStyle['sort-item-active'] : '']"
            @click="handleSortChange(sortOptions[1])"
          >
            最受欢迎
          </view>
        </view>
      </view>

      <!-- 标签筛选 -->
      <view :class="pageStyle['filter-section']">
        <view :class="pageStyle['left-arrow-btn']" @click="handleArrowClick('left')">
          <RectLeft></RectLeft>
        </view>
        <scroll-view
          id="square-tag-list"
          :class="pageStyle['button-group']"
          :enhanced="true"
          :scroll-x="true"
          :scroll-with-animation="true"
          :show-scrollbar="false"
          :scroll-left="scrollLeft"
          @binddragging="handleScroll"
        >
          <view
            v-for="item in spaceOptions"
            :key="item.value"
            class="square-tag-item"
            :class="[pageStyle['filter-button'], { [pageStyle['is-active']]: activeSpace?.value === item.value }]"
            @click="handleSpaceChange(item)"
          >
            {{ item.label }}
          </view>
        </scroll-view>
        <view :class="pageStyle['right-arrow-btn']" @click="handleArrowClick('right')">
          <RectRight></RectRight>
        </view>
      </view>
    </view>
  </view>
  <Loading :visible="loading" text="LOADING" />
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, onUnmounted, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import { Toast } from '@nutui/nutui-taro'
import {Search} from "@nutui/icons-vue-taro";
import {RectLeft, RectRight, IconFont} from '@nutui/icons-vue-taro'
import {cloneDeep} from "@/util/cloneDeep";
import {ACTIVE_COLOR} from "@/constants";
import {ScrollInfo} from "@/util/scrollInfo";
import type { IWorkBaseInfo } from '@/pages/Square/components/WorkCard/const'
import { getSquareList } from '@/api/square/listSquare';
import { getTags } from '@/api/square/getTags';
import {
  CATEGORY_OPTIONS,
  DEFAULT_SPACE_OPTIONS,
  type ISortItem,
  mergeWorks,
  PAGE_SIZE, SORT_OPTIONS,
  TagListManager
} from './const';
import pageStyle from './index.module.less';
import Loading from '@/components/Loading/index.vue';
import {debounce} from "@tarojs/runtime";
import {IObject} from "@/constants/types";


let tagListManager:TagListManager|null = null;
let scrollInfo: ScrollInfo | null = null;

// 定义组件属性
const props = defineProps({});

// 定义事件发射
const emit = defineEmits<{
  filterResult: [IWorkBaseInfo[]]
}>();

const spaceOptions = ref<ISortItem[]>(DEFAULT_SPACE_OPTIONS);
const sortOptions = ref<ISortItem[]>(cloneDeep(SORT_OPTIONS));
const categoryOptions = ref<ISortItem[]>(cloneDeep(CATEGORY_OPTIONS));


// 响应式状态
const activeCategory = ref<ISortItem>(cloneDeep(CATEGORY_OPTIONS[0]));
const activeSort = ref<ISortItem>(cloneDeep(SORT_OPTIONS[0]));
const activeSpace = ref<ISortItem>();
const keyword = ref('');

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
  })
  if (response instanceof Error || response.code !== 200) {
    console.error('Error fetching history:', response)
    Toast.text('获取作品列表失败');
    return
  }
  loading.value = false
  if (!response.data.list.length) loadEnd.value = true
  const list = mergeWorks(currentWorksList.value, response.data.list);
  currentWorksList.value = list;
  emit('filterResult', list);
};

// 处理分类变更
const handleCategoryChange = (value: ISortItem | any) => {
  if (value.value === 'myGroups') {
    Taro.showToast({
      title: '功能暂未开放',
      icon: 'none'
    })
    return;
  }
  const selectedItem = value.value ? value : categoryOptions.value.find(item => item.value === value);
  if (!selectedItem || activeCategory.value.value === selectedItem.value) return
  delete selectedItem.color;
  categoryOptions.value.forEach((item, index) => {
    categoryOptions.value[index].color = undefined;
    if (item.value === selectedItem.value) {
      item.color = ACTIVE_COLOR;
    }
  })
  activeCategory.value = selectedItem;
  handleSearch();
};

// 处理排序变更
const handleSortChange = (value: ISortItem | any) => {
  const selectedItem = value.value ? value : sortOptions.value.find(item => item.value === value);
  if (!selectedItem || activeSort.value.value === selectedItem.value) return
  delete selectedItem.color;
  sortOptions.value.forEach((item, index) => {
    sortOptions.value[index].color = undefined;
    if (item.value === selectedItem.value) {
      item.color = ACTIVE_COLOR;
    }
  })
  activeSort.value = selectedItem;
  handleSearch();
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
