<template>
  <div class="chose-scene-container">
    <div class="panel-body">
      <div class="select-core">
        <ElSelect
          class="model-select-core"
          v-model="selectedSceneModel"
          placeholder="选择场景模型"
          @change="handleSceneModelChange"
        >
          <ElOption
            v-for="model in sceneModels"
            :key="model.id"
            :label="model.name"
            :value="model.id"
          />
        </ElSelect>
        <div class="scene-detail" @click.self="()=>toggleTreeVisible()">
          {{selectedSceneName||"点击选择具体场景"}}
          <div v-show="treeVisible" class="tree-container">
            <ElTree
              :data="currentSceneList"
              :props="TREE_PROPS"
              @node-click="handleTreeNodeClick"
            />
            <div class="tree-footer">
              <ElButton class="tree-footer-btn" @click="()=>toggleTreeVisible()">取消</ElButton>
              <ElButton class="tree-footer-btn" type="primary" @click="confirmSceneSelection">确定</ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, onMounted, ref } from 'vue';
import { ElSelect, ElOption, ElTree, ElButton, ElMessage } from 'element-plus';
import {
  type ISceneModelItem,
  type ISceneItem,
  DEFAULT_SCENE_MODELS,
  TREE_PROPS,
  type ISceneExpose,
  getSceneTree
} from './const.ts';
import { isUndefined } from '@/constants/util.ts';

const emit = defineEmits<{ choseScene: [sceneId?:number]; }>();

// 模拟场景模型数据
const sceneModels = ref<ISceneModelItem[]>(DEFAULT_SCENE_MODELS);
const currentSceneList = ref<ISceneItem[]>([]);
const selectedSceneModel = ref<string>(DEFAULT_SCENE_MODELS[0].id);
const selectedScene = ref<ISceneItem | null>(null);
const selectedSceneName = ref('');
const treeVisible = ref(false);

// 递归获取节点完整路径
const getFullSceneName = (node: ISceneItem, sceneList: ISceneItem[]): string => {
  const findParent = (list: ISceneItem[]): ISceneItem | null => {
    for (const item of list) {
      if (item.children.some(child => child.key === node.key)) {
        return item;
      }
      const parent = findParent(item.children);
      if (parent) {
        return parent;
      }
    }
    return null;
  };

  const parent = findParent(sceneList);
  if (parent) {
    return `${getFullSceneName(parent, sceneList)}-${node.name}`;
  }
  return node.name;
};

// 处理场景模型选择变化
const handleSceneModelChange = (modelId: string) => {
  const model = sceneModels.value.find(m => m.id === modelId);
  if (!model) return;
  currentSceneList.value = model.sceneList;
  selectedScene.value = null;
  selectedSceneName.value = '';
  treeVisible.value = false;
};

// 切换树状选择器显示状态
const toggleTreeVisible = (val?: boolean) => {
  treeVisible.value = isUndefined(val) ? !treeVisible.value : Boolean(val);
};

const confirmSceneSelection = () => {
  toggleTreeVisible(false);
  const model = sceneModels.value.find(m => m.id === selectedSceneModel.value);
  if (!model) return;
  if (selectedScene.value && selectedSceneModel.value) {
    selectedSceneName.value = getFullSceneName(selectedScene.value, model.sceneList);
  }
};

const handleTreeNodeClick = (data: ISceneItem) => {
  console.log(data)
  if (data.children?.length) return;
  selectedScene.value = data;
  emit('choseScene', selectedScene.value?.key ? parseInt(selectedScene.value.key) : undefined);
};

// 获取场景值字符串
const getSceneValue = () => {
  return {
    sceneModelId: selectedSceneModel.value || '',
    sceneName: selectedSceneName.value
  };
};

const initList = async () => {
  const list = await getSceneTree();
  currentSceneList.value = list;
  sceneModels.value[0].sceneList = list;
}

// 更新场景值
const updateSceneValue = async (modelId: string, sceneKey: string) => {
  const model = sceneModels.value.find(m => m.id === modelId);
  if (!model) return;

  if (!model.sceneList?.length) {
    await initList();
  }
  // 递归查找场景节点
  const findSceneNode = (list: ISceneItem[]): ISceneItem | null => {
    for (const item of list) {
      if (item.key === sceneKey) {
        return item;
      }
      const node = findSceneNode(item.children);
      if (node) {
        return node;
      }
    }
    return null;
  };

  const sceneNode = findSceneNode(model.sceneList);
  if (sceneNode) {
    selectedSceneModel.value = modelId;
    currentSceneList.value = model.sceneList;
    handleTreeNodeClick(sceneNode);
    confirmSceneSelection();
  }
};

const validate = () => {
  if (!selectedScene.value){
    ElMessage.error('请选择具体场景');
    return false;
  }
  return true;
}



onMounted(async ()=>{
  await initList();
})

// 对外暴露方法
defineExpose<ISceneExpose>({
  getSceneValue,
  updateSceneValue,
  validate
});
</script>

<style lang="less" scoped>
@import "./index.less";
</style>
