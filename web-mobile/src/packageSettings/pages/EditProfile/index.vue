<template>
  <Layouts>
    <view :class="styles.containerShell">
      <view :class="styles.container">
        <view :class="styles.avatarSection" @click="handleAvatarClick">
          <view :class="styles.avatarWrapper">
            <image
              :src="form.avatar || ''"
              mode="aspectFill"
              :class="styles.avatar"
            />
            <view :class="styles.cameraIcon">
              <Photograph size="14" />
            </view>
          </view>
          <text :class="styles.avatarTip">点击修改头像</text>
        </view>

        <view :class="styles.formGroup">
          <view :class="styles.formItem">
            <text :class="styles.label">昵称</text>
            <input
              :class="styles.input"
              v-model="form.nickname"
              placeholder="请输入昵称"
              placeholder-class="input-placeholder"
              maxlength="12"
            />
          </view>

          <view :class="styles.divider"></view>

          <view :class="styles.formItem">
            <text :class="styles.label">签名</text>
            <input
              :class="styles.input"
              v-model="form.personalSignature"
              placeholder="这位设计师还没给签名填充有趣的内容呢~"
              placeholder-class="input-placeholder"
              maxlength="30"
            />
          </view>
        </view>

        <view :class="styles.footer">
          <view :class="styles.saveButton" @click="handleSave"> 保存修改 </view>
        </view>
      </view>
    </view>

  </Layouts>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Photograph } from "@nutui/icons-vue-taro";
import styles from "./index.module.less";
import Taro from "@tarojs/taro";
import { uploadImageByTaroUrl } from "@/api/files/uploadFileByTaroUrl";
import { getUserInfo, type getUserInfoResponse } from "@/api/users/getUserInfo";
import { updateUserInfo } from "@/api/users/updateUserInfo";
import Layouts from "@/components/Layouts/index.vue";

const form = ref<Partial<getUserInfoResponse>>({});

const fetchUserInfo = async () => {
  const res = await getUserInfo();
  if (res instanceof Error || res.code !== 200) {
    console.error("获取用户信息失败:", res);
    return;
  }
  form.value = res.data || {};
};

const handleAvatarClick = async () => {
  try {
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });

    if (res.tempFilePaths.length > 0) {
      const tempFilePath = res.tempFilePaths[0];
      Taro.showLoading({ title: "上传中..." });

      uploadImageByTaroUrl({
        filePath: tempFilePath,
        fileType: "AVATAR_IMAGE",
        onSuccess: (uploadRes) => {
          Taro.hideLoading();
          if (uploadRes.data && (uploadRes.data.fileUrl || uploadRes.data.url)) {
            form.value.avatar = uploadRes.data.fileUrl || uploadRes.data.url;
          }
        },
        onFail: (err) => {
          Taro.hideLoading();
          Taro.showToast({ title: "上传失败", icon: "none" });
          console.error("Upload failed", err);
        },
      });
    }
  } catch (error) {
    console.error("Choose image failed", error);
  }
};

const handleSave = async () => {
  try {
    Taro.showLoading({ title: "保存中..." });
    const res = await updateUserInfo(form.value);
    if (res instanceof Error || res.code !== 200) {
      console.log(res);
      return;
    }

    Taro.hideLoading();
    Taro.showToast({ title: "保存成功", icon: "success" });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  } catch (error) {
    Taro.hideLoading();
    console.error("Save profile failed", error);
    Taro.showToast({ title: "保存失败", icon: "none" });
  }
};

onMounted(() => {
  fetchUserInfo();
});
definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>
