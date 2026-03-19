<template>
  <nut-popup
    :visible="props.visible"
    position="bottom"
    round
    :close-on-click-overlay="true"
    :safe-area-inset-bottom="false"
    :class="pageStyle['popupWrap']"
    @click-overlay="emit('close')"
  >
    <view :class="pageStyle['panel']">
      <view :class="pageStyle['header']">
        <view :class="pageStyle['backBtn']" @click="emit('close')">
          <RectLeft :class="pageStyle['backIcon']" />
        </view>
        <view :class="pageStyle['searchBar']">
          <Search :class="pageStyle['searchIcon']" />
          <input
            v-model="localKeyword"
            :class="pageStyle['searchInput']"
            placeholder="搜索灵感作品..."
            placeholder-style="color:#cbd5e1;"
            :maxlength="30"
            confirm-type="search"
            @confirm="handleSubmit"
          />
        </view>
      </view>

      <view :class="pageStyle['section']" v-if="historyList.length">
        <view :class="pageStyle['sectionTitleRow']">
          <view :class="pageStyle['sectionTitle']" style="margin-bottom: 0;">历史搜索</view>
          <view :class="pageStyle['clearHistory']" @click="clearHistory">
            <Del size="14" />
          </view>
        </view>
        <view :class="pageStyle['tagList']">
          <view v-for="item in historyList" :key="item" :class="pageStyle['tag']" @click="applyHistory(item)">
            <text :class="pageStyle['tagText']" style="color: #0f172a; font-weight: 500;">{{ item }}</text>
            <view :class="pageStyle['tagClose']" @click.stop="removeHistory(item)">
              <Close size="10" />
            </view>
          </view>
        </view>
      </view>

      <view :class="pageStyle['section']">
        <view :class="pageStyle['sectionTitle']">场景分类</view>
        <view :class="pageStyle['tagList']">
          <view
            v-for="item in props.sceneOptions"
            :key="item"
            :class="[pageStyle['tag'], selectedScene === item ? pageStyle['tagActive'] : '']"
            @click="toggleScene(item)"
          >
            <text :class="pageStyle['tagText']">{{ item }}</text>
          </view>
        </view>
      </view>

      <view :class="pageStyle['submitWrap']">
        <view :class="pageStyle['submit']" @click="handleSubmit">开始搜索</view>
      </view>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Taro from "@tarojs/taro";
import { RectLeft, Search, Del, Close } from "@nutui/icons-vue-taro";
import pageStyle from "./index.module.less";

interface ISearchPopupProps {
  visible: boolean;
  keyword?: string;
  scene?: string;
  sceneOptions: string[];
}

const props = withDefaults(defineProps<ISearchPopupProps>(), {
  visible: false,
  keyword: "",
  scene: "",
  sceneOptions: () => [],
});

const emit = defineEmits<{
  close: [];
  submit: [payload: { keyword: string; scene: string }];
}>();

const HISTORY_KEY = "square-search-history";
const historyList = ref<string[]>([]);
const localKeyword = ref("");
const selectedScene = ref("");

const loadHistory = () => {
  const list = Taro.getStorageSync(HISTORY_KEY);
  historyList.value = Array.isArray(list) ? list.filter((item) => typeof item === "string") : [];
};

const saveHistory = (keyword: string) => {
  if (!keyword) {
    return;
  }
  const next = [keyword, ...historyList.value.filter((item) => item !== keyword)].slice(0, 6);
  historyList.value = next;
  Taro.setStorageSync(HISTORY_KEY, next);
};

const clearHistory = () => {
  historyList.value = [];
  Taro.removeStorageSync(HISTORY_KEY);
};

const removeHistory = (keyword: string) => {
  const next = historyList.value.filter((item) => item !== keyword);
  historyList.value = next;
  Taro.setStorageSync(HISTORY_KEY, next);
};

const applyHistory = (item: string) => {
  localKeyword.value = item;
};

const toggleScene = (item: string) => {
  if (selectedScene.value === item) {
    selectedScene.value = "";
    return;
  }
  selectedScene.value = item;
};

const handleSubmit = () => {
  const keyword = localKeyword.value.trim();
  saveHistory(keyword);
  emit("submit", {
    keyword,
    scene: selectedScene.value,
  });
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return;
    }
    loadHistory();
    localKeyword.value = props.keyword || "";
    selectedScene.value = props.scene || "";
  },
);
</script>
