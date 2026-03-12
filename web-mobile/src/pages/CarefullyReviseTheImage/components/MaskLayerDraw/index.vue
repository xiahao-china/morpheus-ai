<template>
  <div class="mask-layer-draw-shell" v-resize="handleResize" v-loading="uploadInfo.loading">
    <!--  绘图工具栏  -->
    <div class="mask-layer-draw-tools-container">
      <div class="mask-layer-draw-tools">
        <ElTooltip
          class="item"
          effect="dark"
          v-for="item in MASK_LAYER_DRAW_OPTIONS"
          :key="item.type"
          :content="item.label"
          placement="top"
          :style="{ display: item.hidden ? 'none' : '' }"
        >
          <ElIcon
            class="draw-action-icon"
            :class="{
              active: currentDrawType === item.type,
              disabled:
                (item.type === EMaskLayerDrawType.UNDO && historyIndex <= 0) ||
                (item.type === EMaskLayerDrawType.REDO && historyIndex >= history.length - 1),
              'lasso': item.type === EMaskLayerDrawType.LASSO,
              'lasso-eraser': item.type === EMaskLayerDrawType.LASSO_ERASER,
            }"
            @click="() => handleDrawType(item.type)"
          >
            <component :is="item.icon" />
          </ElIcon>
        </ElTooltip>
      </div>
      <!-- 新增画笔粗细调整滑块，放在 mask-layer-draw-tools 下方 -->
      <div class="brush-width-slider-shell" v-if="currentDrawOptions?.needSize">
        <ElSlider
          class="brush-width-slider"
          v-model="brushWidth"
          :min="brushLimitSizeRange.min"
          :max="brushLimitSizeRange.max"
          :step="brushLimitSizeRange.step"
          input-size="small"
          @change="updateBrushWidth"
          :marks="{
            [brushLimitSizeRange.min]: brushLimitSizeRange.min.toString(),
            [brushLimitSizeRange.max]: brushLimitSizeRange.max.toString(),
          }"
          tip-format="画笔粗细: {value}px"
        />
      </div>
    </div>

    <div class="tip-text" v-show="uploadInfo.tipText">{{uploadInfo.tipText}}</div>
    <!--  绘图容器  -->
    <div class="mask-layer-draw" ref="drawContainerShell" id="drawContainer">
      <canvas ref="drawContainer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElIcon, ElMessage, ElSlider, ElTooltip } from 'element-plus';
import { cloneDeep } from '@/util/cloneDeep.ts';
import type { IObject } from '@/constants/types.ts';
import { debounce } from '@/constants/util.ts';
import {
  addShortcutKeys,
  calcBrushMaxSizeRange,
  DEFAULT_BRUSH_LIMIT_SIZE_RANGE,
  DEFAULT_MASK_IMAGE_INFO, drawCircleToBase64,
  EMaskLayerDrawType,
  type IMaskLayerDrawExposed,
  type IMaskLayerDrawProps, loadFabric,
  MASK_LAYER_DRAW_OPTIONS,
  turnCanvasToImageAndUpload
} from './const.ts'

import FabricLassoClass, {ELassoType} from './FabricLassoClass';
import BorderSelectClass from './BorderSelectClass';

// 注意fabric库是一个根据使用场景进行自行选择性封装的库,如果发现有些函数没有，你需要自行在npm包中根据文档自行选择性引入构建
let fabric = window.fabric as IObject;

// 入参
const props = withDefaults(defineProps<IMaskLayerDrawProps>(), {});

// 绘图画布
let maskCanvas: fabric.Canvas;
const drawContainerShell = ref<HTMLDivElement | null>(null);
const drawContainer = ref<HTMLCanvasElement | null>(null);
const currentDrawType = ref<EMaskLayerDrawType | null>(null);
const currentMaskImageEl = ref<HTMLImageElement | null>(null);
// 历史记录栈
const history = reactive<fabric.Object[][]>([]);
const historyIndex = ref(-1);
// 套索对象
let lassoSelection: FabricLassoClass | null = null;
let borderSelection: BorderSelectClass | null = null;
let currentScale = 1;
// 上传信息
const uploadInfo = ref(DEFAULT_MASK_IMAGE_INFO);
// 新增画笔粗细变量
const brushLimitSizeRange = ref(cloneDeep(DEFAULT_BRUSH_LIMIT_SIZE_RANGE));
const brushWidth = ref(30);

const currentDrawOptions = computed(() => {
  return MASK_LAYER_DRAW_OPTIONS.find((item) => item.type === currentDrawType.value);
});

// 根据绘制类型进行对应处理
const handleDrawType = (type: EMaskLayerDrawType) => {
  // 如果已经是套索模式，退出套索模式，此时要重置快捷键
  if (
    currentDrawType.value &&
    [EMaskLayerDrawType.LASSO, EMaskLayerDrawType.LASSO_ERASER].includes(currentDrawType.value) &&
    ![EMaskLayerDrawType.UNDO, EMaskLayerDrawType.REDO, EMaskLayerDrawType.CLEAR].includes(type)
  ) {
    lassoSelection && lassoSelection.exitLasso();
  }

  if (
    currentDrawType.value === EMaskLayerDrawType.BORDER_SELECT &&
    ![EMaskLayerDrawType.UNDO, EMaskLayerDrawType.REDO, EMaskLayerDrawType.CLEAR].includes(type)
  ) {
    borderSelection && borderSelection.exitBorderSelect();
  }

  // 取消选择
  if (type === currentDrawType.value) {
    currentDrawType.value = null;
    maskCanvas.isDrawingMode = false;
    maskCanvas.selection = false;
    return;
  }

  // 快速边缘选取
  if (type === EMaskLayerDrawType.BORDER_SELECT) {
    if (!borderSelection) return;
    maskCanvas.isDrawingMode = false;
    maskCanvas.selection = false;
    currentDrawType.value = type;
    borderSelection.init();
    borderSelection.loadImage(props.imgUrl);
  }

  // 默认框选
  if (type === EMaskLayerDrawType.SELECT) {
    maskCanvas.isDrawingMode = false;
    maskCanvas.selection = true; // 恢复默认选择模式
    currentDrawType.value = type;
    maskCanvas._objects.forEach((obj) => {
      obj.selectable = true;
    });
  }


  if (type === EMaskLayerDrawType.SMUDGE) {
    maskCanvas.freeDrawingBrush = new fabric.PencilBrush(maskCanvas);
    maskCanvas.freeDrawingBrush.width = brushWidth.value;
    maskCanvas.freeDrawingBrush.color = 'rgba(45,92,242,1)';
    maskCanvas.isDrawingMode = true;
    maskCanvas.selection = false; // 禁用默认选择模式
    currentDrawType.value = type;
    updateBrushWidth();
  }

  // 擦除
  if (type === EMaskLayerDrawType.ERASER) {
    if (currentDrawType.value === EMaskLayerDrawType.LASSO) {
      lassoSelection && lassoSelection.cancelDraw();
    }
    maskCanvas.isDrawingMode = true;
    maskCanvas.freeDrawingBrush = new fabric.EraserBrush(maskCanvas);
    // 设置初始橡皮擦粗细
    maskCanvas.freeDrawingBrush.width = brushWidth.value;
    maskCanvas.selection = false; // 禁用默认选择模式
    currentDrawType.value = type;
    updateBrushWidth();
  }
  // 清空
  if (type === EMaskLayerDrawType.CLEAR) {
    if (currentDrawType.value === EMaskLayerDrawType.LASSO) {
      lassoSelection && lassoSelection.cancelDraw();
    }
    maskCanvas.clear();
    saveState();
  }
  // 撤销
  if (type === EMaskLayerDrawType.UNDO) {
    if (historyIndex.value > 0) {
      --historyIndex.value;
      maskCanvas.loadFromJSON(history[historyIndex.value], maskCanvas.renderAll.bind(maskCanvas));
    }
  }
  // 重做
  if (type === EMaskLayerDrawType.REDO) {
    if (historyIndex.value < history.length - 1) {
      ++historyIndex.value;
      console.log('maskCanvas', history[historyIndex.value]);
      maskCanvas.loadFromJSON(history[historyIndex.value], maskCanvas.renderAll.bind(maskCanvas));
      console.log('maskCanvas', maskCanvas);
    }
  }
  // 套索
  if ([EMaskLayerDrawType.LASSO, EMaskLayerDrawType.LASSO_ERASER].includes(type)) {
    if (!lassoSelection) return;
    lassoSelection.updateLassoType(
      type === EMaskLayerDrawType.LASSO_ERASER ? ELassoType.LASSO_ERASER:ELassoType.LASSO
    );
    lassoSelection.startDraw();
    currentDrawType.value = type;
    maskCanvas.isDrawingMode = false;
    maskCanvas.selection = false;
    currentDrawType.value = type;
    maskCanvas._objects.forEach((obj) => {
      obj.selectable = false;
    });
  }
};

// 画笔粗细处理
const updateBrushWidth = () => {
  if (
    currentDrawType.value === EMaskLayerDrawType.SMUDGE ||
    currentDrawType.value === EMaskLayerDrawType.ERASER
  ) {
    maskCanvas.freeDrawingBrush.width = brushWidth.value;
    const brushWidthByScale = brushWidth.value * currentScale;
    maskCanvas.freeDrawingCursor =
      `url(${drawCircleToBase64(brushWidthByScale)}) ${brushWidthByScale/2} ${brushWidthByScale/2}, auto`;
  }
};

// 保存当前状态到历史记录，用于撤销与重做
const saveState = (force?: boolean) => {
  if (
    !force && currentDrawType.value
    && [EMaskLayerDrawType.SELECT, EMaskLayerDrawType.LASSO, EMaskLayerDrawType.LASSO_ERASER].includes(currentDrawType.value)
  ) {
    return;
  }
  historyIndex.value++;
  history.splice(historyIndex.value);
  history.push(JSON.parse(JSON.stringify(maskCanvas.toJSON())));
};


// 初始化绘制
const initDraw = () => {
  const containerEl = drawContainer.value;
  if (!containerEl) return;
  maskCanvas = new fabric.Canvas(containerEl, {
    width: props.width || containerEl.parentElement?.clientWidth,
    height: props.height || containerEl.parentElement?.clientHeight,
  });

  // 根据容器尺寸计算缩放比例及边距，使内容居中展示
  if (drawContainerShell.value) {
    let scale = 1;
    const elWidth = (drawContainerShell.value.parentElement as HTMLElement).clientWidth;
    const elHeight = (drawContainerShell.value.parentElement as HTMLElement).clientHeight;
    const widthRatio =  props.width/elWidth;
    const heightRatio = props.height/elHeight;
    console.log('drawContainerShell', elWidth, elHeight, widthRatio, heightRatio);
    if (heightRatio > widthRatio) {
      scale = (elHeight || 1) / props.height;
      drawContainerShell.value.style.height = `${props.height}px`;
      drawContainerShell.value.style.width = `auto`;
      const calcWidth = props.width * scale;
      const calcMargin = (elWidth - calcWidth) / 2;
      drawContainerShell.value.style.marginTop = `0`;
      drawContainerShell.value.style.marginLeft = `${calcMargin}px`;
    } else {
      scale = (elWidth || 1) / props.width;
      drawContainerShell.value.style.width = `${props.width}px`;
      drawContainerShell.value.style.height = `auto`;
      const calcHeight = props.height * scale;
      const calcMargin = (elHeight - calcHeight) / 2;
      drawContainerShell.value.style.marginLeft = `0`;
      drawContainerShell.value.style.marginTop = `${calcMargin}px`;
    }
    drawContainerShell.value.style.transform = `scale(${scale})`;
    brushLimitSizeRange.value = calcBrushMaxSizeRange(props.width);
    currentScale = scale;
    if (!lassoSelection){
      lassoSelection = new FabricLassoClass({
        canvas: maskCanvas,
        canvasShellEl: drawContainerShell.value,
        scale,
      });
      lassoSelection.onEndDrawHandle.push(() => saveState(true));
    }

    if (!borderSelection){
      borderSelection = new BorderSelectClass({
        canvas: maskCanvas,
        canvasShellEl: drawContainerShell.value,
        scale,
      });
      borderSelection.onStartDrawHandle.push((isFile) => {
        uploadInfo.value.loading = true
        uploadInfo.value.tipText = isFile ? '正在为您加载一键选取模块！' : '努力提取边缘信息中~';
      });
      borderSelection.onDrawTerHandle.push(() => {
        uploadInfo.value.loading = false
        uploadInfo.value.tipText = '';
      });
      borderSelection.onEndDrawHandle.push(() => {
        saveState(true);
        uploadInfo.value.loading = false;
        uploadInfo.value.tipText = '';
      });
    }
  }

  saveState();
  // 监听画布变化，保存状态
  maskCanvas.on('mouse:up', () => saveState(false));

  if (drawContainerShell.value){
    const container = drawContainerShell.value.getElementsByClassName('canvas-container')[0];
    if (!container) return;
    const imgEl = document.createElement('img');
    imgEl.setAttribute('class', 'mid-mask-img');
    imgEl.src = props.imgUrl;
    container.appendChild(imgEl);
    currentMaskImageEl.value = imgEl;
  }
};

// 新增校验方法
const validateHistory = () => {
  if (history.length <= 1) {
    ElMessage.warning('您还未标记需要修改的内容');
    return false;
  }
  return true;
};

// comfyui工作流需要黑底蒙版，因此需要将画布背景设置为黑色，将其他部分设置为透明
const uploadCanvasAsImage = async () => {
  if (!maskCanvas) {
    ElMessage.error('Canvas 未初始化');
    return null;
  }
  await new Promise((resolve) => {
    maskCanvas.setBackgroundColor('rgba(0,0,0,1)', resolve);
  });
  const res = await turnCanvasToImageAndUpload(maskCanvas, uploadInfo);
  maskCanvas.setBackgroundColor('rgba(0,0,0,0)', () => {});
  return res;
};

const getMaskImageInfo = () => {
  return uploadInfo.value;
};

// 重置组件状态，避免绘制意外问题
const reloadComponent = () => {
  currentDrawType.value = null;
  if (lassoSelection) {
    lassoSelection.exitLasso();
    lassoSelection = null;
  }
  if (borderSelection) {
    borderSelection.exitBorderSelect();
    borderSelection = null;
  }
  if (maskCanvas) {
    maskCanvas.clear();
    maskCanvas.dispose();
  }
  history.splice(0);
  historyIndex.value = -1;
  initDraw();
};

const handleResize = debounce(() => {
  reloadComponent();
}, 100)

watch(()=>props.width, reloadComponent);
watch(()=>props.height, reloadComponent);
watch(()=>props.imgUrl, (val)=>{
  if (currentDrawType.value === EMaskLayerDrawType.BORDER_SELECT) {
    borderSelection && borderSelection.loadImage(val);
  }
  if (currentMaskImageEl.value) {
    currentMaskImageEl.value.src = val;
  }
});

defineExpose<IMaskLayerDrawExposed>({
  validateHistory,
  uploadCanvasAsImage,
  getMaskImageInfo,
  reloadComponent,
});

onMounted(async () => {
  // 使用全局的方式引入fabric.js
  await loadFabric();
  fabric = window.fabric as IObject;
  fabric.Polygon.NUM_FRACTION_DIGITS = 8;
  initDraw();
  // 添加快捷键
  addShortcutKeys(handleDrawType);
});
</script>

<style lang="less" scoped>
@import './index.less';

.brush-width-slider {
  padding: 0 16px;
}
</style>
