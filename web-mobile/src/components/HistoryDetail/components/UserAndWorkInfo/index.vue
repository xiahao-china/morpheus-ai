<template>
  <view :class="pageStyle['user-and-work-info']">
    <!-- 用户信息模块 -->
    <view :class="pageStyle['user-info']">
      <image :class="pageStyle['avatar']" :src="user.avatar" mode="aspectFill" />
      <view :class="pageStyle['user-meta']">
        <text :class="pageStyle['nickname']">{{ user.username || user.nickname }}</text>
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
  const response = await collectSquare(props.work.workId);
  console.log(response);
  if (response instanceof Error || response.code !== 200) {
    if ((response as IObject).status === 401){
      handle401ToLogin(true);
    }
    return console.log(response);
  }
  if (props.work.isCollection){
    likeCountStr.value = turnNumberToString(props.work.collections + (isCollection.value?-1:0));
  }else {
    likeCountStr.value = turnNumberToString(props.work.collections + (isCollection.value?0:1));
  }
  isCollection.value = !isCollection.value;
  emit('collect', isCollection.value);
  return;
}

watch(() => props.work, (val) => {
  isCollection.value = val.isCollection;
  likeCountStr.value = turnNumberToString(props.work.collections);
})

</script>

<style lang="less" scoped>
</style>
