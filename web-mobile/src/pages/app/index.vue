<template>
  <Layouts>
    <view :class="styles['app-layout']">
      <view :class="styles['app-layout-content']">
        <view :class="styles['app-page-container']">
          <nut-tabs v-model="value" :animated-time="0">
            <nut-tab-pane
              title="开始绘图"
              pane-key="1"
              :class="styles['tab-pane']"
            >
              <view>
                <CollapsiblePanel title="基础模型" :notCollapsed="true">
                  <ModelSetting @model-change="handleModelChange" />
                </CollapsiblePanel>
                <CollapsiblePanel title="提示词" not-collapsed>
                  <PromptSetting ref="promptSettingRef" />
                </CollapsiblePanel>
              </view>
            </nut-tab-pane>
            <nut-tab-pane
              title="历史记录"
              pane-key="2"
              :class="styles['tab-pane']"
            >
              Content 2
            </nut-tab-pane>
          </nut-tabs>
        </view>
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import Layouts from "@/components/Layouts/index.vue";
import { ref } from "vue";
import Taro from "@tarojs/taro";
import styles from "./index.module.less";
import CollapsiblePanel from "@/components/CollapsiblePanel/index.vue";
import ModelSetting from "./components/ModelSetting/index.vue";
import PromptSetting from "./components/PromptSetting/index.vue";
import type { BaseModelRecord } from "@/api/system/config/getBaseModels";

// 页面状态
const value = ref("1");

/**
 * 处理模型选择变化
 * @param model 选中的模型数据
 */
const handleModelChange = (model: BaseModelRecord | null) => {
  if (model) {
    console.log("选中的模型:", model);
    // Taro.showToast({
    //   title: `已选择模型: ${model.value}`,
    //   icon: "success",
    //   duration: 2000,
    // });
  } else {
    console.log("未选择模型");
  }
};
</script>
