<template>
  <view :class="styles.userTabs">
    <view :class="styles.customTabBar">
      <view
        v-for="item in tabsList"
        :key="item.id"
        :class="[styles.tabItem, { [styles.active]: tab === item.id }]"
        @click="handleTabChange(item.id)"
      >
        <component :is="item.icon" :class="styles.tabIcon" />
        <text>{{ item.name }}</text>
      </view>
    </view>

    <view :class="styles.filterSection" v-if="tab === ETabType.History && FILTER_OPTIONS.length > 1">
      <view :class="styles.filterTrigger" @click="showAllTags = true">
        <text :class="styles.triggerLabel">
          当前筛选：{{
            FILTER_OPTIONS.find((o) => o.value === selectedType)?.label || "全部"
          }}
        </text>
        <view :class="styles.triggerIcon">
          <RectDown size="16" />
        </view>
      </view>
    </view>

    <!-- 底部弹窗展示所有筛选选项 -->
    <nut-popup
      v-model:visible="showAllTags"
      position="bottom"
      round
      :style="{ height: '40%' }"
    >
      <view :class="styles.popupContent">
        <view :class="styles.popupHeader">
          <text>选择类型</text>
          <view :class="styles.closeIcon" @click="showAllTags = false">
            <RectDown size="16" style="transform: rotate(180deg)" />
          </view>
        </view>
        <scroll-view :scroll-y="true" :class="styles.popupBody">
          <view :class="styles.tagsGrid">
            <view
              v-for="opt in FILTER_OPTIONS"
              :key="opt.value"
              :class="[
                styles.popupTag,
                { [styles.activeTag]: selectedType === opt.value },
              ]"
              @click="
                handleTypeChange(opt.value);
                showAllTags = false;
              "
            >
              {{ opt.label }}
            </view>
          </view>
        </scroll-view>
      </view>
    </nut-popup>

    <view :class="styles.scrollView">
      <view :class="styles.imageGrid">
        <view :class="styles.historyGrid" v-if="tab === ETabType.History">
          <view
            v-for="item in historyList"
            :key="`history-${item.id}`"
            :class="styles.imageItem"
            @click="handleImageClick(item)"
          >
            <view
              v-if="isBatchMode"
              :class="[
                styles.checkboxOverlay,
                { [styles.checked]: selectedItems.has(item.id) },
              ]"
              :key="`checkbox-${item.id}-${selectedItemsUpdateKey}`"
            >
              <Check v-if="selectedItems.has(item.id)" size="12" color="#fff" />
            </view>
            <image
              :src="item.url"
              mode="aspectFill"
              :class="styles.image"
              lazy-load
              @error="handleImageError"
            />
          </view>
        </view>
        <view :class="styles.collectionGrid" v-else-if="tab === ETabType.SquareCollection">
          <view
            v-for="item in collectionList"
            :key="`collection-${item.id}`"
            :class="styles.imageItem"
            @click="handleCollectionImageClick(item)"
          >
            <view
              v-if="isBatchMode"
              :class="[
                styles.checkboxOverlay,
                { [styles.checked]: selectedItems.has(item.id) },
              ]"
              :key="`checkbox-${item.id}-${selectedItemsUpdateKey}`"
            >
              <Check v-if="selectedItems.has(item.id)" size="12" color="#fff" />
            </view>
            <image
              :src="item.url"
              mode="aspectFill"
              :class="styles.image"
              lazy-load
              @error="handleImageError"
            />
          </view>
        </view>
        <view :class="styles.publicationGrid" v-else-if="tab === ETabType.MyPublication">
          <view
            v-for="item in publicationList"
            :key="`publication-${item.id}`"
            :class="styles.imageItem"
            @click="handlePublicationImageClick(item)"
          >
            <view
              v-if="isBatchMode"
              :class="[
                styles.checkboxOverlay,
                { [styles.checked]: selectedItems.has(item.id) },
              ]"
              :key="`checkbox-${item.id}-${selectedItemsUpdateKey}`"
            >
              <Check v-if="selectedItems.has(item.id)" size="12" color="#fff" />
            </view>
            <image
              :src="item.url"
              mode="aspectFill"
              :class="styles.image"
              lazy-load
              @error="handleImageError"
            />
          </view>
        </view>
      </view>
      <view v-if="loading" :class="styles.loadingText">加载中...</view>
      <view
        v-if="
          !loading &&
          (tab === ETabType.History ? historyFinished : tab === ETabType.SquareCollection ? collectionFinished : publicationFinished)
        "
        :class="styles.noMoreText"
      >
        没有更多了
      </view>
    </view>

    <!-- Floating Controls -->
    <view :class="styles.floatingControls">
      <!-- Batch Download -->
      <view
        :class="styles.floatingBtn"
        @click="toggleBatchMode('download')"
        v-if="!isBatchMode"
      >
        <Download size="16" color="#333" />
      </view>

      <!-- Batch Delete - 只在历史记录页面和我的发布页面显示 -->
      <view
        :class="styles.floatingBtn"
        @click="toggleBatchMode('delete')"
        v-if="!isBatchMode && (tab === ETabType.History || tab === ETabType.MyPublication)"
      >
        <Del size="16" color="#333" />
      </view>

      <!-- Back To Top -->
      <view
        :class="[styles.floatingBtn, { [styles.hidden]: !showBackToTop }]"
        @click="handleBackToTop"
      >
        <Top size="16" color="#333" />
      </view>
    </view>

    <!-- Bottom Action Panel for Batch Mode -->
    <view :class="styles.bottomActionPanel" v-if="isBatchMode">
      <view :class="[styles.actionBtn, styles.cancel]" @click="exitBatchMode"
        >取消</view
      >
      <view
        :class="[
          styles.actionBtn,
          styles.confirm,
          { [styles.delete]: batchAction === 'delete' },
        ]"
        @click="handleBatchConfirm"
      >
        {{ batchAction === "delete" ? "删除" : "下载" }} ({{
          selectedItems.size
        }})
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import {
  ETabType,
  TABS,
  FILTER_OPTIONS,
  SUPPORTED_TYPES,
  PAGE_SIZE,
  SCROLL_THRESHOLD
} from "./const";
import { getMyHistory, EHistoryFilterTime } from "@/api/images/getMyHistory";
import { getMyCollections } from "@/api/square/myCollections";
import { getMyPublishedRecords } from "@/api/square/myPublished";
import { deleteSquareRecord } from "@/api/square/deleteSquareRecord";
import { makeUrlAbsolute } from "@/util/url";
import { onMounted, ref, computed } from "vue";
import {
  Clock,
  Heart,
  Top,
  RectDown,
  Del,
  Download,
  Check,
  Edit,
} from "@nutui/icons-vue-taro";
import styles from "./index.module.less";
import Taro, { usePageScroll } from "@tarojs/taro";
import { EDrawingType } from "@/api/generate/workStream";
import { API_URL } from "@/constants";
import { getCookie } from "@/util/cookie";
import { deleteBatchImage } from "@/api/images/deleteBatchImage";
import { batchDownload } from "@/util/download";




const tab = ref(ETabType.History);
const selectedType = ref<string>("");
const showBackToTop = ref(false);
const showAllTags = ref(false);

// Batch Operation States
const isBatchMode = ref(false);
const batchAction = ref<"delete" | "download" | "">("");
const selectedItems = ref<Set<string>>(new Set());

// 用于强制更新选择状态的辅助变量
const selectedItemsUpdateKey = ref(0);

// 使用从 const.ts 导入的筛选选项常量

const historyList = ref<
  {
    id: string;
    url: string;
    originalUrl?: string;
    recordId: number;
    type: string;
    fileResourceId: number;
  }[]
>([]);

const collectionList = ref<
  {
    id: string;
    url: string;
    originalUrl?: string;
    recordId?: string;
    type?: string;
    fileResourceId?: string;
  }[]
>([]);

const publicationList = ref<
  {
    id: string;
    url: string;
    originalUrl?: string;
    recordId?: string;
    type?: string;
    fileResourceId?: string;
  }[]
>([]);

// Pagination States
const historyPage = ref(1);
const collectionPage = ref(1);
const publicationPage = ref(1);
const historyFinished = ref(false);
const collectionFinished = ref(false);
const publicationFinished = ref(false);
const loading = ref(false);
// 使用从 const.ts 导入的分页大小常量

const tabsList = computed(() => {
  return TABS.map((t) => ({
    ...t,
    icon: t.id === ETabType.History ? Clock : t.id === ETabType.MyPublication ? Edit : Heart,
  }));
});

const handleTabChange = (id: string) => {
  if (isBatchMode.value) return;
  if (tab.value === id) return;
  tab.value = id as ETabType;
  if (
    (id === ETabType.History && historyList.value.length === 0) ||
    (id === ETabType.SquareCollection && collectionList.value.length === 0) ||
    (id === ETabType.MyPublication && publicationList.value.length === 0)
  ) {
    loadData();
  }
};

const handleTypeChange = (type: string) => {
  if (selectedType.value === type) return;
  selectedType.value = type;
  historyList.value = [];
  historyPage.value = 1;
  historyFinished.value = false;
  loadData();
};

const toggleBatchMode = (action: "delete" | "download") => {
  isBatchMode.value = true;
  batchAction.value = action;
  selectedItems.value = new Set();
  // 强制更新视图
  selectedItemsUpdateKey.value++;
};

const exitBatchMode = () => {
  isBatchMode.value = false;
  batchAction.value = "";
  selectedItems.value = new Set();
  // 强制更新视图
  selectedItemsUpdateKey.value++;
};

const handleBatchConfirm = () => {
  if (selectedItems.value.size === 0) {
    Taro.showToast({ title: "请至少选择一项", icon: "none" });
    return;
  }

  // 如果是下载操作，执行批量下载
  if (batchAction.value === "download") {
    batchDownloadImages(selectedItems.value);
    return;
  }

  // 如果是删除操作，执行批量删除
  if (batchAction.value === "delete") {
    Taro.showModal({
      title: "确认删除",
      content: `确定要删除选中的${selectedItems.value.size}张图片吗？`,
      success: (res) => {
        if (res.confirm) {
          // 执行批量删除
          batchDeleteImages(selectedItems.value);
        }
      },
    });
  }
};

const loadData = async () => {
  if (loading.value) return;

  loading.value = true;
  try {
    if (tab.value === ETabType.History) {
      if (historyFinished.value) return;
      const res = await getMyHistory({
        pageNo: historyPage.value,
        pageSize: PAGE_SIZE,
        timeRange: EHistoryFilterTime.all,
        ...(selectedType.value ? { type: selectedType.value } : {}),
      });

      if (res instanceof Error) {
        console.error("请求历史记录失败", res);
        return;
      }

      if (res.data.records && res.data.records.length > 0) {
        const newItems: {
          id: string;
          url: string;
          originalUrl?: string;
          recordId: number;
          fileResourceId: number;
          type: string;
        }[] = [];
        res.data.records.forEach((record) => {
          const images =
            record.editedGeneratedImages &&
            record.editedGeneratedImages.length > 0
              ? record.editedGeneratedImages
              : record.generatedImages;

          if (images && images.length > 0) {
            images.forEach((img) => {
              // 优先使用 url256，与广场保持一致
              const imgUrl = img.url256 || img.imageUrl || img.recordThumbnailUrl || "";
              if (imgUrl) {
                newItems.push({
                  id: img.id.toString(),
                  fileResourceId: img.fileResourceId,
                  url: makeUrlAbsolute(imgUrl),
                  originalUrl: makeUrlAbsolute(img.imageUrl || img.recordThumbnailUrl || ""),
                  recordId: record.id,
                  type: record.type,
                });
              }
            });
          }
        });

        historyList.value = [...historyList.value, ...newItems];

        if (res.data.records.length < PAGE_SIZE) {
          historyFinished.value = true;
        } else {
          historyPage.value++;
        }
      } else {
        historyFinished.value = true;
      }
    } else if (tab.value === ETabType.SquareCollection) {
      if (collectionFinished.value) return;
      const res = await getMyCollections({
        pageNo: collectionPage.value,
        pageSize: PAGE_SIZE,
      });

      if (res instanceof Error) {
        console.error("请求收藏列表失败", res);
        return;
      }

      if (res.data.records && res.data.records.length > 0) {
        const newItems = res.data.records
          .map((record) => {
            // @ts-ignore
            const imgUrl = record.url256 || record.imageUrl || record.scaleThumbnailUrl || "";
            // @ts-ignore
            const originalUrl = record.imageUrl || record.scaleThumbnailUrl || "";
            return {
              id: record.squareId.toString(),
              url: makeUrlAbsolute(imgUrl),
              originalUrl: makeUrlAbsolute(originalUrl),
              recordId: record.imageId ? record.imageId.toString() : "",
              fileResourceId: record.fileResourceId?.toString() || "",
            };
          })
          .filter((item) => item.url);

        collectionList.value = [...collectionList.value, ...newItems];
        if (res.data.records.length < PAGE_SIZE) {
          collectionFinished.value = true;
        } else {
          collectionPage.value++;
        }
      } else {
        collectionFinished.value = true;
      }
    } else if (tab.value === ETabType.MyPublication) {
      if (publicationFinished.value) return;
      const res = await getMyPublishedRecords({
        pageNo: publicationPage.value,
        pageSize: PAGE_SIZE,
      });

      if (res instanceof Error) {
        console.error("请求我的发布列表失败", res);
        return;
      }

      if (res.data.records && res.data.records.length > 0) {
        const newItems = res.data.records
          .map((record) => {
            const imgUrl = record.squareImage?.scaleThumbnailUrl || record.squareImage?.imageUrl || "";
            const originalUrl = record.squareImage?.imageUrl || "";
            return {
              id: record.id.toString(),
              url: makeUrlAbsolute(imgUrl),
              originalUrl: makeUrlAbsolute(originalUrl),
              fileResourceId: record.squareImage?.fileResourceId?.toString() || "",
            };
          })
          .filter((item) => item.url);

        publicationList.value = [...publicationList.value, ...newItems];
        if (res.data.records.length < PAGE_SIZE) {
          publicationFinished.value = true;
        } else {
          publicationPage.value++;
        }
      } else {
        publicationFinished.value = true;
      }
    }
  } catch (error) {
    console.error("Failed to load data", error);
  } finally {
    loading.value = false;
  }
};

// 处理图片加载错误
const handleImageError = (e: any) => {
  console.error("图片加载失败:", e);
};

// 下载单个图片
const downloadImage = async (item: {
  id: string;
  url: string;
  originalUrl?: string;
  fileResourceId?: string;
}) => {
  if (!item.url && !item.originalUrl) {
    Taro.showToast({ title: "图片URL不存在", icon: "none" });
    return false;
  }

  try {
    const url = item.originalUrl || item.url;

    // 指定明确的后缀名，避免小程序 saveImageToPhotosAlbum 报错 fail invalid
    const filePath = `${Taro.env.USER_DATA_PATH}/download_${Date.now()}.jpg`;

    const res = await Taro.downloadFile({
      url,
      filePath,
      header: { Cookie: getCookie() || "" },
    });

    if ((res as any).statusCode === 200) {
      return new Promise<boolean>((resolve) => {
        Taro.saveImageToPhotosAlbum({
          filePath: (res as any).filePath || (res as any).tempFilePath,
          success: () => {
            resolve(true);
          },
          fail: (err) => {
            console.error('保存相册失败:', err);
            resolve(false);
          },
        });
      });
    } else {
      return false;
    }
  } catch (error) {
    console.error("下载图片出错:", error);
    return false;
  }
};

// 批量下载图片
const batchDownloadImages = async (selectedIds: Set<string>) => {
  if (selectedIds.size === 0) {
    Taro.showToast({ title: "请至少选择一张图片", icon: "none" });
    return;
  }

  // 获取当前页面的图片列表
  const currentList =
    tab.value === ETabType.History ? historyList.value : tab.value === ETabType.SquareCollection ? collectionList.value : publicationList.value;

  // 过滤出选中的图片
  const selectedImages = currentList.filter((item) => selectedIds.has(item.id));

  // 检查所有图片是否有url
  const imagesWithoutUrl = selectedImages.filter(
    (item) => !item.url && !item.originalUrl
  );
  if (imagesWithoutUrl.length > 0) {
    Taro.showToast({ title: "部分图片无法下载", icon: "none" });
    return;
  }

  const urls = selectedImages.map(item => item.originalUrl || item.url);
  await batchDownload(urls);

  // 下载完成后退出批量模式
  exitBatchMode();
};

// 批量删除图片
const batchDeleteImages = async (selectedIds: Set<string>) => {
  if (selectedIds.size === 0) {
    Taro.showToast({ title: "请至少选择一张图片", icon: "none" });
    return;
  }

  if (tab.value === ETabType.MyPublication) {
    try {
      Taro.showLoading({ title: "删除中...", mask: true });

      // 删除发布的广场内容
      const deletePromises = Array.from(selectedIds).map(id => deleteSquareRecord(id));
      await Promise.all(deletePromises);

      Taro.hideLoading();

      // 从列表中移除已删除的图片
      publicationList.value = publicationList.value.filter(
        (item) => !selectedIds.has(item.id)
      );

      Taro.showToast({
        title: `成功删除${selectedIds.size}项发布`,
        icon: "success",
      });

      // 删除完成后退出批量模式
      exitBatchMode();
    } catch (error) {
      Taro.hideLoading();
      console.error("删除发布出错:", error);
      Taro.showToast({
        title: "删除失败，请重试",
        icon: "error",
      });
    }
    return;
  }

  // 获取当前页面的图片列表
  const currentList = historyList.value;

  // 过滤出选中的图片
  const selectedImages = currentList.filter((item) => selectedIds.has(item.id));

  // 提取所有选中的图片 ID
  const imageIds: string[] = selectedImages.map((item) => item.id.toString());

  try {
    Taro.showLoading({ title: "删除中...", mask: true });

    // 调用删除API
    const result = await deleteBatchImage({
      imageIds,
    });

    Taro.hideLoading();

    // 检查删除结果
    if (result && !(result instanceof Error)) {
      // 从列表中移除已删除的图片
      if (tab.value === ETabType.History) {
        historyList.value = historyList.value.filter(
          (item) => !selectedIds.has(item.id)
        );
      } else {
        collectionList.value = collectionList.value.filter(
          (item) => !selectedIds.has(item.id)
        );
      }

      Taro.showToast({
        title: `成功删除${selectedIds.size}张图片`,
        icon: "success",
      });

      // 删除完成后退出批量模式
      exitBatchMode();
    } else {
      throw new Error("删除失败");
    }
  } catch (error) {
    Taro.hideLoading();
    console.error("删除图片出错:", error);
    Taro.showToast({
      title: "删除失败，请重试",
      icon: "error",
    });
  }
};

// 使用从 const.ts 导入的支持类型常量

// 处理历史记录图片点击
const handleImageClick = (item: {
  id: string;
  url: string;
  recordId: number;
  type: string;
  fileResourceId: number;
}) => {
  console.log(item);

  if (isBatchMode.value) {
    const id = item.id;
    const newSelectedItems = new Set(selectedItems.value);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    selectedItems.value = newSelectedItems;
    // 强制更新视图
    selectedItemsUpdateKey.value++;
    return;
  }

  // 和广场那边一样进入历史详情页
  Taro.navigateTo({
    url: `/packageHistory/pages/HistoryDetailPage/index?taskId=${item.recordId}&defaultImgId=${item.id}&type=history`,
    events: {
      likeStatusChange: (status: boolean) => {
        // do nothing for history list or handle if needed
      }
    }
  });
};

// 处理广场收藏图片点击
const handleCollectionImageClick = async (item: {
  id: string;
  url: string;
  recordId?: string;
  type?: string;
  fileResourceId?: string;
}) => {
  if (isBatchMode.value) {
    const id = item.id;
    const newSelectedItems = new Set(selectedItems.value);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    selectedItems.value = newSelectedItems;
    // 强制更新视图
    selectedItemsUpdateKey.value++;
    return;
  }

  // 和广场那边一样进入历史详情页
  Taro.navigateTo({
    url: `/packageHistory/pages/HistoryDetailPage/index?id=${item.id}&type=square`,
    events: {
      likeStatusChange: (status: boolean) => {
        if (!status){
          collectionList.value = collectionList.value.filter(
            (innerItem) => innerItem.id !== item.id
          );
        }
      }
    }
  });
};

// 处理我的发布图片点击
const handlePublicationImageClick = async (item: {
  id: string;
  url: string;
  originalUrl?: string;
  recordId?: string;
  type?: string;
  fileResourceId?: string;
}) => {
  if (isBatchMode.value) {
    const id = item.id;
    const newSelectedItems = new Set(selectedItems.value);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    selectedItems.value = newSelectedItems;
    // 强制更新视图
    selectedItemsUpdateKey.value++;
    return;
  }

  // 导航到详情页面，传递作品ID
  Taro.navigateTo({
    url: `/packageHistory/pages/HistoryDetailPage/index?id=${item.id}&type=square`
  });
};

usePageScroll((res) => {
  showBackToTop.value = res.scrollTop > SCROLL_THRESHOLD;
});

const handleBackToTop = () => {
  Taro.pageScrollTo({
    scrollTop: 0,
    duration: 300,
  });
};

onMounted(() => {
  loadData();
});

defineExpose({
  loadData,
});
</script>
