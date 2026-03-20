<template>
  <view :class="pageStyle['dialogWrap']">
    <view :class="pageStyle['dialogBody']">
<!--      <view :class="pageStyle['modeTrigger']" @click="showModePopup = true">-->
<!--        <text>{{ selectedMode.label }}</text>-->
<!--        <RectRight :class="pageStyle['modeArrow']" />-->
<!--      </view>-->

      <view :class="pageStyle['contentRow']">
        <view :class="pageStyle['uploadBox']" @click="handlePickImage">
          <image v-if="uploadImageUrl" :src="uploadImageUrl" mode="aspectFill" :class="pageStyle['uploadPreview']" />
          <Photograph v-else :class="pageStyle['uploadIcon']" />
          <view v-if="uploading" :class="pageStyle['uploadProgress']">{{ uploadProgress }}%</view>
          <view v-if="uploadImageUrl" :class="pageStyle['removeImage']" @click.stop="clearImage">
            <Close :class="pageStyle['removeIcon']" />
          </view>
        </view>

        <view :class="pageStyle['inputWrap']">
          <textarea
            v-model="prompt"
            :class="pageStyle['input']"
            :maxlength="300"
            placeholder="输入文字，创意无限可能"
            auto-height
            :show-confirm-bar="false"
          />
        </view>

        <view :class="[pageStyle['sendBtn'], sendDisabled ? pageStyle['disabled'] : '']" @click="handleSubmit">
          发送
        </view>
      </view>
    </view>

    <nut-popup v-model:visible="showModePopup" position="bottom" round>
      <view :class="pageStyle['popupContent']">
        <view :class="pageStyle['popupTitle']">选择生图模式</view>
        <view :class="pageStyle['modeGrid']">
          <view
            v-for="mode in props.modeOptions"
            :key="mode.id"
            :class="[pageStyle['modeItem'], selectedMode.id === mode.id ? pageStyle['modeItemActive'] : '']"
            @click="selectMode(mode)"
          >
            {{ mode.label }}
          </view>
        </view>
      </view>
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Taro from "@tarojs/taro";
import { Close, Photograph, RectRight } from "@nutui/icons-vue-taro";
import { uploadImageByTaroUrl } from "@/api/files/uploadFileByTaroUrl";
import type { UploadImageResponse } from "@/api/files/uploadFile";
import { EDrawingType } from "@/api/generate/workStream";
import type { IDrawingModeOption } from "@/pages/DrawingV2/const";
import type { IBottomDialogProps } from "./const";
import pageStyle from "./index.module.less";

const props = withDefaults(defineProps<IBottomDialogProps>(), {
  modeOptions: () => [],
  generating: false,
});

const emit = defineEmits<{
  submit: [payload: { prompt: string; mode: IDrawingModeOption; underImageId?: string; underImageUrl?: string }];
}>();

const prompt = ref("");
const showModePopup = ref(false);
const selectedMode = ref<IDrawingModeOption>(
  props.modeOptions[0] || {
    id: "inspiration",
    label: "灵感生图",
    type: EDrawingType.INSPIRATION,
  },
);
const uploadImageUrl = ref("");
const uploadImageId = ref("");
const uploading = ref(false);
const uploadProgress = ref(0);

const sendDisabled = computed(() => {
  return !prompt.value.trim() || props.generating;
});

const handlePickImage = async () => {
  if (uploading.value) {
    return;
  }
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
  });
  const filePath = res.tempFilePaths?.[0];
  if (!filePath) {
    return;
  }
  uploading.value = true;
  uploadProgress.value = 0;
  uploadImageByTaroUrl(
    {
      filePath,
      fileType: "UNDER_IMAGE",
      onSuccess: (result) => {
        const data = result.data as UploadImageResponse | undefined;
        uploadImageUrl.value = data?.fileUrl || data?.url || "";
        uploadImageId.value = data?.fileId || String(data?.id || "");
      },
      onFail: () => {
        Taro.showToast({ title: "上传失败", icon: "error" });
      },
    },
    (progressInfo) => {
      uploadProgress.value = progressInfo.presentage || 0;
      if (uploadProgress.value >= 100) {
        uploading.value = false;
      }
    },
  );
};

const clearImage = () => {
  uploadImageUrl.value = "";
  uploadImageId.value = "";
  uploading.value = false;
  uploadProgress.value = 0;
};

const selectMode = (mode: IDrawingModeOption) => {
  selectedMode.value = mode;
  showModePopup.value = false;
};

const handleSubmit = () => {
  if (sendDisabled.value) {
    return;
  }
  emit("submit", {
    prompt: prompt.value.trim(),
    mode: selectedMode.value,
    underImageId: uploadImageId.value || undefined,
    underImageUrl: uploadImageUrl.value || undefined,
  });
  prompt.value = "";
};

const reset = () => {
  prompt.value = "";
  clearImage();
};

defineExpose({
  reset,
});
</script>
