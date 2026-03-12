<template>
  <view :class="styles.modelSetting">
    <!-- 模型选择器 -->
    <view :class="styles.formItem">
      <nut-cell
        :title="selectedModelName || '请选择模型'"
        is-link
        @click="showPicker = true"
        :class="styles.selectContainer"
      />
    </view>

    <!-- 模型选择弹窗 -->
    <nut-popup
      v-model:visible="showPicker"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <view :class="styles.pickerContainer">
        <view :class="styles.pickerTitle">请选择模型</view>
        <view :class="styles.pickerContent">
          <nut-radio-group v-model="formData.selectedModel">
            <view
              v-for="model in models"
              :key="model.id"
              :class="[
                styles.baseModelOption,
                !Boolean(model.remark) ? styles.baseModelOptionSmall : '',
                !model.isEnabled ? styles.disabledOption : '',
              ]"
            >
              <nut-radio
                :label="model.id"
                :disabled="!model.isEnabled"
                :style="{ width: '100%' }"
              >
                <view :class="styles.baseModelListItem">
                  <text :class="styles.baseModelName">{{ model.value }}</text>
                  <text
                    v-if="model.remark"
                    :class="styles.baseModelSubscript"
                    >{{ model.remark }}</text
                  >
                </view>
              </nut-radio>
            </view>
          </nut-radio-group>
        </view>

        <!-- 确认按钮 -->
        <view style="padding: 20px">
          <nut-button type="primary" block @click="confirmSelection">
            确认选择
          </nut-button>
        </view>
      </view>
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, reactive, computed } from "vue";
import Taro from "@tarojs/taro";
import {
  getBaseModels,
  type BaseModelRecord,
} from "@/api/system/config/getBaseModels";
import { mockResponse } from "./const";
import { getCookie } from "@/util/cookie";
// import { useConfigStore } from '@/pages/app/store/config';
// 导入CSS Module样式
import styles from "./index.module.less";

type Model = BaseModelRecord;

// 定义事件
const emit = defineEmits<{
  modelChange: [model: Model | null];
}>();

// const configStore = useConfigStore();

// 响应式数据
const formData = reactive({
  selectedModel: null as number | null, // 改为null，避免-1的混淆
});

const models = ref<Model[]>([]);
const showPicker = ref(false);

// 计算属性：获取当前选中的模型信息
const selectedModel = computed(() => {
  if (formData.selectedModel === null || formData.selectedModel === undefined) {
    return null;
  }
  return (
    models.value.find((model) => model.id === formData.selectedModel) || null
  );
});

const selectedModelName = computed(() => {
  return selectedModel.value?.value || "";
});

const selectedModelRemark = computed(() => {
  return selectedModel.value?.remark || "";
});

// 移除了handleModelChange函数，因为v-model会自动处理值的变化

/**
 * 确认选择
 */
const confirmSelection = () => {
  if (formData.selectedModel === null || formData.selectedModel === undefined) {
    Taro.showToast({
      title: "请选择一个模型",
      icon: "none",
    });
    return;
  }
  showPicker.value = false;
};

// 暴露方法给父组件
const validate = async (): Promise<boolean> => {
  if (formData.selectedModel === null || formData.selectedModel === undefined) {
    Taro.showToast({
      title: "请选择基础模型",
      icon: "none",
    });
    return false;
  }
  return true;
};

const clearValidate = () => {
  // 在小程序环境中，清除验证状态（如果需要的话）
  console.log("清除验证状态");
};

const resetForm = () => {
  formData.selectedModel = null;
};

const updateModelSelected = (modelId: number | string) => {
  formData.selectedModel = parseInt(modelId.toString());
};

// 暴露方法
defineExpose({
  validate,
  clearValidate,
  resetForm,
  updateModelSelected,
});

/**
 * 组件挂载时获取模型列表
 */
onMounted(() => {
  getBaseModelsFn();
});

// 获取模型列表
const getBaseModelsFn = async () => {
  try {
    // 获取基础模型列表
    const res = await getBaseModels({ pageNo: 1, pageSize: 999 });
    if (res instanceof Error || res.code !== 200) {
      Taro.showToast({
        title: "获取模型列表失败",
        icon: "none",
      });
      return;
    }
    // 过滤掉 isEnabled 为 false 的模型
    const list = (res.data.records || []).filter((model) => model.isEnabled);
    models.value = list;
    // 只有在没有选择任何模型时才设置默认值
    if (models.value.length > 0 && formData.selectedModel === null) {
      formData.selectedModel = models.value[0].id; // 默认选择第一个模型
    }
  } catch (error) {
    console.error("获取模型列表失败:", error);
    Taro.showToast({
      title: "获取模型列表失败",
      icon: "none",
    });
  }
};

// 模拟数据
const getBaseModelsMock = async () => {
  try {
    models.value = mockResponse.records || [];
    // 只有在没有选择任何模型时才设置默认值
    if (models.value.length > 0 && formData.selectedModel === null) {
      formData.selectedModel = models.value[0].id; // 默认选择第一个模型
    }
  } catch (error) {
    console.error("加载模拟数据失败:", error);
  }
};

// 监听模型选择变化
watch(
  () => formData.selectedModel,
  (newModelId) => {
    const selectedModelData = models.value.find(
      (model) => model.id === newModelId
    );
    if (selectedModelData) {
      // configStore.setBaseModel(selectedModelData);
    }
    emit("modelChange", selectedModelData || null);
  },
  { immediate: true }
);
</script>
<style lang="less" module>
/* CSS Module 样式已在 index.module.less 中定义 */
/* 这里可以添加一些组件特定的样式覆盖 */
</style>
