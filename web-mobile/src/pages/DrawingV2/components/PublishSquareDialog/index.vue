<template>
  <nut-popup
    :visible="visible"
    position="bottom"
    :lock-scroll="true"
    :close-on-click-overlay="false"
    :safe-area-inset-bottom="false"
    :overlay-style="{ background: 'transparent' }"
    @click-overlay="handleClose"
    :class="pageStyle['popupWrap']"
  >
    <view :class="pageStyle['maskLayer']" @click="handleClose">
      <view :class="pageStyle['panel']" @click.stop>
        <view :class="pageStyle['header']">
          <text :class="pageStyle['title']">发布到广场</text>
          <view :class="pageStyle['closeBtn']" @click="handleClose">
            <RectDown :class="pageStyle['closeIcon']" />
          </view>
        </view>

        <scroll-view :scroll-y="true" :class="pageStyle['body']">
          <view :class="pageStyle['preview']">
            <image
              v-if="imageUrl"
              :src="imageUrl"
              mode="aspectFit"
              :class="pageStyle['previewImage']"
            />
          </view>

          <view :class="pageStyle['block']">
            <text :class="pageStyle['label']">作品标题</text>
            <input
              v-model="title"
              :maxlength="20"
              :class="pageStyle['input']"
              placeholder="给你的设计起个好听的名字"
              placeholder-style="color:#cbd5e1;"
            />
          </view>

          <view :class="pageStyle['block']">
            <text :class="pageStyle['label']">设计简介</text>
            <textarea
              v-model="caption"
              :maxlength="100"
              :class="pageStyle['textarea']"
              placeholder="分享你的设计理念或装修心得..."
              placeholder-style="color:#cbd5e1;"
              :show-confirm-bar="false"
            />
          </view>

          <view :class="pageStyle['tagGroup']">
            <view :class="pageStyle['tagTitle']">装修风格</view>
            <view :class="pageStyle['tagList']">
              <view
                v-for="tag in STYLE_TAGS"
                :key="tag"
                :class="[pageStyle['tag'], selectedStyleTags.includes(tag) ? pageStyle['tagActive'] : '']"
                @click="toggleTag(tag, 'style')"
              >
                {{ tag }}
              </view>
            </view>
          </view>

          <view :class="pageStyle['tagGroup']">
            <view :class="pageStyle['tagTitle']">场景标签</view>
            <view :class="pageStyle['tagList']">
              <view
                v-for="tag in SCENE_TAGS"
                :key="tag"
                :class="[pageStyle['tag'], selectedSceneTags.includes(tag) ? pageStyle['tagActive'] : '']"
                @click="toggleTag(tag, 'scene')"
              >
                {{ tag }}
              </view>
            </view>
          </view>
        </scroll-view>

        <view :class="pageStyle['footer']">
          <view
            :class="[
              pageStyle['submit'],
              canSubmit ? pageStyle['submitActive'] : pageStyle['submitDisabled'],
            ]"
            @click="handleSubmit"
          >
            {{ confirmLoading ? "发布中..." : "立即发布" }}
          </view>
        </view>
      </view>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Taro from "@tarojs/taro";
import { RectDown } from "@nutui/icons-vue-taro";
import { publishToSquare } from "@/api/square/publishToSquare";
import type { IStartPublishParams, ISubmitPublishPayload } from "./const";
import { SCENE_TAGS, STYLE_TAGS } from "./const";
import pageStyle from "./index.module.less";

const visible = ref(false);
const confirmLoading = ref(false);
const imageUrl = ref("");
const messageId = ref("");
const imageId = ref("");
const drawTaskId = ref<string | undefined>(undefined);

const emit = defineEmits<{
  published: [payload: { messageId: string }];
}>();

const title = ref("");
const caption = ref("");
const selectedStyleTags = ref<string[]>([]);
const selectedSceneTags = ref<string[]>([]);

const canSubmit = computed(() => title.value.trim() && caption.value.trim() && !confirmLoading.value);

const resetForm = () => {
  title.value = "";
  caption.value = "";
  selectedStyleTags.value = [];
  selectedSceneTags.value = [];
};

const resetContext = () => {
  imageUrl.value = "";
  messageId.value = "";
  imageId.value = "";
  drawTaskId.value = undefined;
};

const startPublish = (params: IStartPublishParams) => {
  messageId.value = params.messageId;
  imageId.value = params.imageId;
  drawTaskId.value = params.drawTaskId;
  imageUrl.value = params.imageUrl || "";
  resetForm();
  visible.value = true;
};

const toggleTag = (tag: string, group: "style" | "scene") => {
  const target = group === "style" ? selectedStyleTags.value : selectedSceneTags.value;
  const total = selectedStyleTags.value.length + selectedSceneTags.value.length;
  const index = target.indexOf(tag);
  if (index > -1) {
    target.splice(index, 1);
    return;
  }
  if (total >= 5) {
    Taro.showToast({ title: "标签最多选择5个", icon: "none" });
    return;
  }
  target.push(tag);
};

const handleSubmit = () => {
  if (!canSubmit.value) {
    return;
  }
  if (!imageId.value) {
    Taro.showToast({ title: "图片未完成", icon: "none" });
    return;
  }
  const payload: ISubmitPublishPayload = {
    title: title.value.trim(),
    caption: caption.value.trim(),
    styleTags: selectedStyleTags.value.slice(),
    sceneTags: selectedSceneTags.value.slice(),
  };
  confirmLoading.value = true;
  publishToSquare({
    ...payload,
    styleTags: payload.styleTags.length ? payload.styleTags : undefined,
    sceneTags: payload.sceneTags.length ? payload.sceneTags : undefined,
    imageId: imageId.value,
    drawTaskId: drawTaskId.value,
  }).then((response) => {
    if (response instanceof Error || response.code !== 200) {
      Taro.showToast({ title: "发布失败", icon: "error" });
      return;
    }
    visible.value = false;
    emit("published", { messageId: messageId.value });
    resetContext();
    Taro.showToast({ title: "已发布到广场", icon: "success" });
  }).finally(() => {
    confirmLoading.value = false;
  });
};

const handleClose = () => {
  if (confirmLoading.value) {
    return;
  }
  visible.value = false;
  resetContext();
};

defineExpose({
  startPublish,
});
</script>
