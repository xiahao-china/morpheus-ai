<template>
  <view :class="styles['main-image-card']">
    <view :class="styles['image-wrapper']">
      <image :src="imageUrl" mode="widthFix" :class="styles['image']" />
    </view>
    <view :class="styles['content']">
      <view :class="styles['title-row']">
        <text :class="styles['title']">{{ title }}</text>
        <view
          :class="[styles['like-box'], isCollected ? styles['active'] : '']"
          @click="handleCollect"
        >
          <IconFont
            v-if="isCollected"
            name="heart-fill"
            size="16"
            color="#ff4081"
          />
          <IconFont
            v-else
            name="heart"
            size="16"
            color="#999"
          />
          <text :class="styles['count']">{{ likeCountStr }}</text>
        </view>
      </view>
      <view :class="styles['tags']">
        <view v-for="(tag, index) in tags" :key="index" :class="styles['tag']">
          #{{ tag }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from "vue";
import { IconFont } from "@nutui/icons-vue-taro";
import styles from "./index.module.less";
import { turnNumberToString } from "@/constants/util";

const props = defineProps<{
  imageUrl: string;
  title: string;
  tags: string[];
  likeCount: number;
  isCollected: boolean;
}>();

const emit = defineEmits<{
  (e: "collect"): void;
}>();

const likeCountStr = computed(() => turnNumberToString(props.likeCount));

const handleCollect = () => {
  emit("collect");
};
</script>
