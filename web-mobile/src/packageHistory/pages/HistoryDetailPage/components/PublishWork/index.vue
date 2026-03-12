<template>
  <view :class="pageStyle['publish-content']">
    <view :class="pageStyle['title']">发布作品</view>
    <nut-form
      :class="pageStyle['publish-form']"
      ref="formRef"
      :model-value="formData"
    >
      <!-- 标题 -->
      <nut-form-item label="标题" prop="title" :class="pageStyle['form-item']">
        <nut-input
          v-model="formData.title"
          placeholder="请输入标题（最多20字）"
          :maxlength="20"
          show-word-limit
        />
      </nut-form-item>

      <!-- 描述 -->
      <nut-form-item
        label="描述"
        prop="description"
        :class="pageStyle['form-item']"
      >
        <nut-textarea
          v-model="formData.description"
          placeholder="请输入描述（最多100字）"
          :rows="3"
          :maxlength="100"
          show-word-limit
        />
      </nut-form-item>

      <!-- 风格标签 -->
      <view :class="pageStyle['tag-group']">
        <nut-form-item
          prop="styleTags"
          :class="pageStyle['tag-selector']"
          label="风格标签"
        >
          <view :class="pageStyle['tag-selector-group']">
            <view
              v-for="tag in styleTags"
              :key="tag.id"
              :class="[
                pageStyle['tag-selector-item'],
                {
                  [pageStyle['tag-selected']]: formData.styleTags.includes(
                    tag.name
                  ),
                },
              ]"
              @click="handleTagClick(tag.name, 'styleTags')"
            >
              <nut-tag :class="pageStyle['tag-item']" :closable="false">
                {{ tag.name }}
                <Close
                  :class="pageStyle['delete-icon']"
                  v-if="tag.canDelete"
                  @click.stop="() => deleteTag(tag, TagType.STYLE)"
                />
              </nut-tag>
            </view>
            <AddCustomTag
              @save="(str) => handleAddCustomTag(TagType.STYLE, str)"
            />
          </view>
        </nut-form-item>
      </view>

      <!-- 场景标签 -->
      <view :class="pageStyle['tag-group']">
        <nut-form-item
          prop="sceneTags"
          :class="pageStyle['tag-selector']"
          label="场景标签"
        >
          <view :class="pageStyle['tag-selector-group']">
            <view
              v-for="tag in sceneTags"
              :key="tag.id"
              :class="[
                pageStyle['tag-selector-item'],
                {
                  [pageStyle['tag-selected']]: formData.sceneTags.includes(
                    tag.name
                  ),
                },
              ]"
              @click="handleTagClick(tag.name, 'sceneTags')"
            >
              <nut-tag :class="pageStyle['tag-item']" :closable="false">
                {{ tag.name }}
                <Close
                  v-if="tag.canDelete"
                  @click.stop="() => deleteTag(tag, TagType.SCENE)"
                />
              </nut-tag>
            </view>
            <AddCustomTag
              @save="(str) => handleAddCustomTag(TagType.SCENE, str)"
            />
          </view>
        </nut-form-item>
      </view>

      <view :class="pageStyle['btn-group']">
        <nut-button
          type="primary"
          :class="pageStyle['cancel-btn']"
          @click="handleCancel"
        >
          取消
        </nut-button>
        <nut-button
          type="primary"
          :class="pageStyle['submit-btn']"
          @click="handleSubmit"
        >
          发布
        </nut-button>
      </view>
    </nut-form>
  </view>
</template>

<script setup lang="ts">
import { defineEmits, onMounted, reactive, ref } from "vue";
import { Toast } from "@nutui/nutui-taro";
import { Close } from "@nutui/icons-vue-taro";
import { publishToSquare } from "@/api/square/publishToSquare";
import pageStyle from "./index.module.less";
import { EFunctionGroupMode } from "@/pages/CarefullyReviseTheImage/components/FunctionGroup/const";
import {
  defaultSceneTags,
  defaultStyleTags,
  deleteCustomTagAndSave,
  getTagList,
  type IPublishWorkProps,
  type IPublishWorkTag,
  type PublishFormData,
  saveCustomTag,
  TagType,
} from "./const";
import AddCustomTag from "../AddCustomTag/index.vue";

// 定义事件 emits
const emit = defineEmits<{
  save: [];
  cancel: [];
}>();

const props = withDefaults(defineProps<IPublishWorkProps>(), {});

// 表单引用
const formRef = ref();

// 表单数据
const formData = reactive<PublishFormData>({
  title: "",
  description: "",
  styleTags: [],
  sceneTags: [],
});

// 标签数据
const styleTags = ref<IPublishWorkTag[]>(defaultStyleTags);
const sceneTags = ref<IPublishWorkTag[]>(defaultSceneTags);

const initTagList = async () => {
  const list = await getTagList();
  styleTags.value = list.styleTags;
  sceneTags.value = list.sceneTags;
};

// 加载本地存储的标签并合并默认标签
onMounted(initTagList);

// 处理标签点击事件
const handleTagClick = (
  tagName: string,
  tagType: "styleTags" | "sceneTags"
) => {
  const currentTags = formData[tagType];
  const index = currentTags.indexOf(tagName);
  if (index > -1) {
    currentTags.splice(index, 1);
  } else {
    currentTags.push(tagName);
  }
};

// 添加自定义标签
const handleAddCustomTag = (type: TagType, tagStr: string) => {
  if (!tagStr.trim()) {
    Toast.warn("请输入标签内容");
    return;
  }
  // 创建新标签
  const newTag = {
    id: Date.now().toString(),
    name: tagStr.trim(),
    type,
    canDelete: true,
  };
  if (type === TagType.STYLE) {
    const hasStyleTag = styleTags.value.some((tag) => tag.name === newTag.name);
    if (hasStyleTag) {
      Toast.warn("风格标签已存在");
      return;
    }
    styleTags.value.push(newTag);
    formData.styleTags.push(newTag.name);
  } else {
    const hasSceneTag = sceneTags.value.some((tag) => tag.name === newTag.name);
    if (hasSceneTag) {
      Toast.warn("场景标签已存在");
      return;
    }
    sceneTags.value.push(newTag);
    formData.sceneTags.push(newTag.name);
  }
  // 保存到本地存储
  saveCustomTag(newTag);

  Toast.success("标签添加成功");
};

const deleteTag = (tag: IPublishWorkTag, tagType: TagType) => {
  if (tag.canDelete) {
    if (tagType === TagType.STYLE) {
      styleTags.value = styleTags.value.filter((t) => t.id !== tag.id);
      formData.styleTags = formData.styleTags.filter((t) => t !== tag.name);
    } else {
      sceneTags.value = sceneTags.value.filter((t) => t.id !== tag.id);
      formData.sceneTags = formData.sceneTags.filter((t) => t !== tag.name);
      console.log(formData.sceneTags, tag);
    }

    deleteCustomTagAndSave(tag);
  }
};

// 表单提交处理
const handleSubmit = async () => {
  // 简化表单验证，因为nutui的form验证方式不同
  if (!formData.title.trim()) {
    Toast.fail("请输入标题");
    return;
  }

  if (!formData.description.trim()) {
    Toast.fail("请输入描述");
    return;
  }

  if (formData.styleTags.length + formData.sceneTags.length > 5) {
    Toast.fail("风格标签与场景标签最多选择5个");
    return;
  }

  const response = await publishToSquare({
    title: formData.title,
    caption: formData.description,
    styleTags: formData.styleTags.join(",") || undefined,
    sceneTags: formData.sceneTags.join(",") || undefined,
    imageId: props.taskInfo.images[props.currentIndex].id,
    drawTaskId:
      props.taskInfo.type === EFunctionGroupMode.DRAWING
        ? props.taskInfo.id
        : undefined,
    editedTaskId:
      props.taskInfo.type !== EFunctionGroupMode.DRAWING
        ? props.taskInfo.id
        : undefined,
  });
  if (response instanceof Error || response.code !== 200) {
    console.log(response);
    return;
  }
  Toast.success("发布成功!");
  emit("save");
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style lang="less" scoped></style>
