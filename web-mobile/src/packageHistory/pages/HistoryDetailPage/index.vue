<template>
  <Layouts>
    <view :class="pageStyle['history-detail-page']">
      <view :class="pageStyle['content-container']" v-if="taskInfo">
        <template v-if="!showPublishBlock">
          <!-- Main Image Card -->
          <MainImageCard
            :imageUrl="taskInfo.images[currentImgIndex].imageUrl"
            :title="type === 'history' ? undefined : (workInfo?.title || '未命名作品')"
            :tags="type === 'history' ? undefined : [...(workInfo?.type || []), ...(workInfo?.scene || [])]"
            :likeCount="type === 'history' ? undefined : (workInfo?.collections || 0)"
            :isCollected="!!publishInfo.isCollected"
            :isSquare="type === 'square'"
            @collect="handleCollect"
          />

          <!-- User Info Card -->
          <UserInfoCard
            v-if="type === 'square' && userInfo"
            :user="userInfo"
            :updateTime="workInfo?.updateTime || ''"
          />

          <!-- Description Card -->
          <DescriptionCard
            v-if="type === 'square' && workInfo?.description"
            :description="workInfo.description"
          />

          <!-- Detail Info (Generation + Reference) -->
          <DetailInfo
            :taskInfo="taskInfo"
            :publishInfo="publishInfo"
            :only-show-one-img="onlyOneImage"
            @publish="showPublishBlock = true"
            @cancel-publish="handleCancelPublish"
          />
        </template>

        <PublishWork
          v-else
          :taskInfo="taskInfo"
          :current-index="currentImgIndex"
          @cancel="showPublishBlock = false"
          @save="handleSave"
        />
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import Layouts from "@/components/Layouts/index.vue";
import { onMounted, ref } from "vue";
import Taro from "@tarojs/taro";
import dayjs from "dayjs";
import { cloneDeep } from "@/util/cloneDeep";
import pageStyle from "./index.module.less";

import {
  getGenerationsDetail,
  type IGetGenerationHistoryItem,
} from "@/api/images/getGenerationHistoryDetail";
import {
  getGenerationsChangeImageDetail,
  type IGetChangeGenerationHistoryItem,
} from "@/api/images/getGenerationChangeImageHistoryDetail";
import { getSquareDetail } from "@/api/square/squareDetail";
import { collectSquare } from "@/api/square/collectSquare";
import type { ApiResponse } from "@/lib/request/http";
import type { IObject } from "@/constants/types";
import { handle401ToLogin } from "@/lib/router/config";

import {
  CHANGE_IMAGE_MODE_LIST,
  EFunctionGroupMode,
} from "@/pages/CarefullyReviseTheImage/components/FunctionGroup/const";
import {
  DEFAULT_PUBLISH_INFO,
  EPublishStatus,
  type ISquarePublishInfo,
} from "./components/DetailInfo/const";

import PublishWork from "./components/PublishWork/index.vue";
import DetailInfo from "./components/DetailInfo/index.vue";
import MainImageCard from "./components/MainImageCard/index.vue";
import UserInfoCard from "./components/UserInfoCard/index.vue";
import DescriptionCard from "./components/DescriptionCard/index.vue";

import {
  DEFAULT_USER_INFO,
  DEFAULT_WORK_INFO,
  type UserInfo,
  type WorkInfo,
} from "./components/UserAndWorkInfo/const";

import { handleToHistoryTaskInfo, type IHistoryTaskInfo } from "./const";
import { makeUrlAbsolute } from "@/util/url";
import {getIsWeb} from "@/util/envCheck";
import {getCurrentPage} from "@tarojs/runtime";

// 页面状态
const loading = ref(true);
const onlyOneImage = ref(false);
const currentImgIndex = ref(0);
const taskInfo = ref<IHistoryTaskInfo>();
const userInfo = ref<UserInfo>();
const workInfo = ref<WorkInfo>();

const showPublishBlock = ref(false);
const publishInfo = ref<ISquarePublishInfo>(cloneDeep(DEFAULT_PUBLISH_INFO));

// 从路由参数获取ID
const id = ref<string>("");
const taskId = ref<string>("");
const type = ref<"history" | "square">("history");

// 初始化页面参数
const initPageParams = () => {
  const params = Taro.getCurrentInstance()?.router?.params || {};
  id.value = params.id as string;
  taskId.value = params.taskId as string;
  type.value = (params.type as string) || "history";

  if (type.value === "square" && !id.value) {
    Taro.showToast({ title: "缺少作品ID参数", icon: "error" });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
    return false;
  }

  if (type.value === "history" && !taskId.value) {
    Taro.showToast({ title: "缺少任务ID参数", icon: "error" });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
    return false;
  }

  return true;
};

// 初始化历史记录详情
const initHistoryDetail = async (
  taskId: string,
  taskType: EFunctionGroupMode,
  defaultImgId: number
) => {
  try {
    loading.value = true;
    let response:
      | Error
      | ApiResponse<
          IGetGenerationHistoryItem | IGetChangeGenerationHistoryItem
        >;

    if (CHANGE_IMAGE_MODE_LIST.includes(taskType)) {
      response = await getGenerationsChangeImageDetail(taskId);
    } else {
      response = await getGenerationsDetail(taskId);
    }

    if (response instanceof Error || response.code !== 200) {
      console.error("获取历史记录失败:", response);
      Taro.showToast({ title: "获取历史记录失败", icon: "error" });
      return;
    }

    const findIndex = response.data.images.findIndex(
      (item) => item.id === defaultImgId
    );
    if (findIndex !== -1) {
      currentImgIndex.value = findIndex;
    }

    publishInfo.value.publishStatus = response.data.images[
      currentImgIndex.value
    ].isPublishedSquare
      ? EPublishStatus.published
      : EPublishStatus.unpublish;
    taskInfo.value = handleToHistoryTaskInfo(response.data, false);
  } catch (error) {
    console.error("初始化历史记录详情失败:", error);
    Taro.showToast({ title: "获取详情失败", icon: "error" });
  } finally {
    loading.value = false;
  }
};

// 初始化广场详情
const initSquareDetail = async (squareId: string) => {
  try {
    loading.value = true;
    const response = await getSquareDetail(squareId);

    if (response instanceof Error || response.code !== 200) {
      console.error("获取广场详情失败:", response);
      Taro.showToast({ title: "获取广场详情失败", icon: "error" });
      return;
    }

    onlyOneImage.value = true;
    currentImgIndex.value = 0;
    taskInfo.value = handleToHistoryTaskInfo(response.data, true);
    publishInfo.value.publishStatus = EPublishStatus.published;
    publishInfo.value.isFromWorks = true;
    publishInfo.value.showPublishBtn = false;
    publishInfo.value.isCollected = response.data.isCollected;

    userInfo.value = {
      username: response.data.username || DEFAULT_USER_INFO.username,
      avatar: makeUrlAbsolute(response.data.avatar || DEFAULT_USER_INFO.avatar),
      nickname: response.data.nickname,
    };

    workInfo.value = {
      title: response.data.title || DEFAULT_WORK_INFO.title,
      description: response.data.caption || DEFAULT_WORK_INFO.description,
      type: response.data.styleTags.split(",") || DEFAULT_WORK_INFO.type,
      scene: response.data.sceneTags.split(",") || DEFAULT_WORK_INFO.scene,
      updateTime: response.data.updateTime
        ? dayjs(response.data.updateTime).format("YYYY-MM-DD HH:mm:ss")
        : DEFAULT_WORK_INFO.updateTime,
      isCollection: response.data.isCollected,
      workId: response.data.id.toString(),
      collections: response.data.collectCount || DEFAULT_WORK_INFO.collections,
    };
  } catch (error) {
    console.error("初始化广场详情失败:", error);
    Taro.showToast({ title: "获取详情失败", icon: "error" });
  } finally {
    loading.value = false;
  }
};

const handleCancelPublish = () => {
  Taro.navigateBack();
};

const handleSave = () => {
  showPublishBlock.value = false;
  publishInfo.value.publishStatus = EPublishStatus.published;
  if (taskInfo.value)
    taskInfo.value.images[currentImgIndex.value].isPublishedSquare = true;
};

const handleCollect = async () => {
  if (!taskInfo.value?.squareId || !workInfo.value) return;

  const currentIsCollected = !!publishInfo.value.isCollected;
  const action = currentIsCollected ? "unlike" : "like";

  const response = await collectSquare(taskInfo.value.squareId, action);

  if (response instanceof Error || response.code !== 200) {
    if ((response as IObject).status === 401) {
      handle401ToLogin(true);
    }
    console.error("操作失败:", response);
    return;
  }

  // 使用接口返回的最新数据更新状态
  const { isCollected, collectCount } = response.data;

  publishInfo.value.isCollected = isCollected;
  workInfo.value.isCollection = isCollected;
  workInfo.value.collections = collectCount;

  const pages = Taro.getCurrentPages();
  const current = pages[pages.length - 1];
  const eventChannel = current.getOpenerEventChannel();
  eventChannel.emit('likeStatusChange', isCollected);

  Taro.showToast({
    title: isCollected ? "收藏成功" : "取消收藏",
    icon: "success",
  });
};

// 页面加载时初始化数据
onMounted(async () => {
  if (!initPageParams()) return;

  if (type.value === "square") {
    await initSquareDetail(id.value);
  } else {
    const params = Taro.getCurrentInstance()?.router?.params || {};
    const taskType =
      (params.type as string as EFunctionGroupMode) ||
      EFunctionGroupMode.DRAWING;
    const defaultImgId = Number(params.defaultImgId) || 0;

    await initHistoryDetail(taskId.value, taskType, defaultImgId);
  }
});

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>
