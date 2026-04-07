<template>
  <view :class="pageStyle['user-and-work-info']">
    <!-- 用户信息模块 -->
    <view :class="pageStyle['user-info']">
      <image :class="pageStyle['avatar']" :src="user.avatar" mode="aspectFill" />
      <view :class="pageStyle['user-meta']">
        <text :class="pageStyle['nickname']">{{ user.nickname }}</text>
      </view>
    </view>

    <!-- 作品信息模块 -->
    <view :class="pageStyle['work-info']">
      <view :class="pageStyle['title-container']">
        <text :class="pageStyle['title']">{{ work.title }}</text>
        <view :class="pageStyle['tags']">
          <nut-tag
            :class="[pageStyle['tag'], pageStyle['type-tag']]"
            v-for="(item,index) in work.type"
            :key="index"
          >
            {{ item }}
          </nut-tag>
          <nut-tag
            :class="[pageStyle['tag'], pageStyle['scene-tag']]"
            v-for="(item,index) in work.scene"
            :key="index"
          >
            {{ item }}
          </nut-tag>
        </view>
      </view>
      <text :class="pageStyle['description']">{{ work.description }}</text>
      <view :class="pageStyle['extra-info-block']">
        <view :class="[pageStyle['collections'], {[pageStyle['active']]: isCollection}]" @click="handleCollection">
          <IconFont :class="pageStyle['collection-icon']" font-class-name="iconfont" class-prefix="icon" name="icon_love_hover" />
          <view :class="pageStyle['collections-data']">{{ likeCountStr }}</view>
        </view>
        <view :class="pageStyle['update-info']">更新时间：{{ work.updateTime }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from 'vue';
import {IconFont} from '@nutui/icons-vue-taro';
import { type UserInfo, type WorkInfo } from './const';
import { collectSquare } from '@/api/square/collectSquare';
import { turnNumberToString } from '@/constants/util';
import type { IObject } from '@/constants/types';
import pageStyle from './index.module.less';
import {handle401ToLogin} from "@/lib/router/config";

const props = defineProps<{
  user: UserInfo;
  work: WorkInfo;
}>();

const emit = defineEmits<{
  collect: [boolean];
}>();

const isCollection = ref(props.work.isCollection);
const likeCountStr = ref(turnNumberToString(props.work.collections));

const handleCollection = async () => {
  const action = isCollection.value ? 'unlike' : 'like';
  const response = await collectSquare(props.work.workId, action);
  
  if (response instanceof Error || response.code !== 200) {
    if ((response as IObject).status === 401){
      handle401ToLogin(true);
    }
    console.error("操作失败:", response);
    return;
  }

  // 使用接口返回的最新数据更新状态
  const { isCollected, collectCount } = response.data;
  
  isCollection.value = isCollected;
  likeCountStr.value = turnNumberToString(collectCount);

  emit('collect', isCollected);
}

watch(() => props.work, (val) => {
  isCollection.value = val.isCollection;
  likeCountStr.value = turnNumberToString(props.work.collections);
})

</script>

<style lang="less" scoped>
</style>
