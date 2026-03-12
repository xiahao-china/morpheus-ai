<template>
  <view :class="pageStyle['agreement']">
    <view
      :class="[pageStyle['checkbox'], agreed ? pageStyle['checked'] : '']"
      @click="toggleAgree"
    >
      <text v-if="agreed" :class="pageStyle['check-icon']">✓</text>
    </view>
    <text :class="pageStyle['prefix']">{{ AGREEMENT_PREFIX_TEXT }}</text>
    <navigator
      :class="pageStyle['agreement-navigator']"
      url="/packageSettings/pages/PrivacyPolicy/index"
    >
      {{ PRIVACY_POLICY_TEXT }}
    </navigator>
    <navigator
      :class="pageStyle['agreement-navigator']"
      url="/packageSettings/pages/ServiceAgreement/index"
    >
      {{ SERVICE_AGREEMENT_TEXT }}
    </navigator>

    <RootPortalEl>
      <nut-dialog
        v-model:visible="dialogVisible"
        :title="DIALOG_TITLE_TEXT"
        :content="DIALOG_CONTENT_TEXT"
        ok-text="同意并继续"
        cancel-text="取消"
        @ok="handleAgree"
        @cancel="closeDialog"
      >
        <view :class="pageStyle['dialog-content']">
          <text :class="pageStyle['prefix']">{{ AGREEMENT_PREFIX_TEXT }}</text>
          <navigator
            :class="pageStyle['agreement-navigator']"
            url="/packageSettings/pages/PrivacyPolicy/index"
          >
            {{ PRIVACY_POLICY_TEXT }}
          </navigator>
          <navigator
            :class="pageStyle['agreement-navigator']"
            url="/packageSettings/pages/ServiceAgreement/index"
          >
            {{ SERVICE_AGREEMENT_TEXT }}
          </navigator>
        </view>
      </nut-dialog>
    </RootPortalEl>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import pageStyle from "./index.module.less";
import RootPortalEl from "@/components/RootPortalEl/index.vue";
import {
  AGREEMENT_PREFIX_TEXT,
  PRIVACY_POLICY_TEXT,
  SERVICE_AGREEMENT_TEXT,
  DIALOG_TITLE_TEXT,
  DIALOG_CONTENT_TEXT,
} from "./const";

const agreed = ref(false);
const dialogVisible = ref(false);
const onAgreeCallback = ref<(() => void) | null>(null);

const toggleAgree = () => {
  agreed.value = !agreed.value;
};

const validateAgreed = () => {
  return agreed.value;
};

const openDialog = (cb?: () => void) => {
  onAgreeCallback.value = cb || null;
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const handleAgree = () => {
  agreed.value = true;
  dialogVisible.value = false;
  onAgreeCallback.value && onAgreeCallback.value();
  onAgreeCallback.value = null;
};

defineExpose({ validateAgreed, openDialog });
</script>
