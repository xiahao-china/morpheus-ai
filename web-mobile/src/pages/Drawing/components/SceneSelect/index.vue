<template>
  <view :class="pageStyle['scene-select-container']">
    <view :class="pageStyle['panel']">
      <view v-show="!selected" :class="pageStyle['panel-header']">{{ title }}</view>

      <view v-show="!selected" :class="pageStyle['scroll-shell']">
        <scroll-view :class="pageStyle['scroll-view']" :scroll-x="true">
          <view
            v-for="opt in options"
            :key="opt.id"
            :class="pageStyle['option-item']"
            @click="select(opt)"
          >
            <image :src="opt.image" :class="pageStyle['thumb']" mode="aspectFill"/>
            <view :class="pageStyle['label']">{{ opt.name }}</view>
          </view>
        </scroll-view>
      </view>

      <view v-show="selected" :class="pageStyle['selected-shell']">
        <view :class="pageStyle['left']">
          <view :class="pageStyle['title']">{{ title }}</view>
          <view :class="pageStyle['selected-text']">{{ selected?.name }}</view>
        </view>
        <view :class="pageStyle['right-block']">
          <scroll-view
            id="scene-right-scroll"
            :class="pageStyle['scroll-view']"
            :scroll-x="true"
            :enhanced="true"
            :scroll-with-animation="true"
            :show-scrollbar="false"
            :scroll-left="rightScrollLeft"
            @scroll="handleRightScroll"
            @scrollend="handleRightDragEnd"
          >
            <view
              v-for="(opt) in options"
              :key="opt.id"
              :class="[pageStyle['option-item'], opt.id === selected?.id ? pageStyle['option-item-selected'] : '']"
              :data-id="opt.id"
              @click="select(opt)"
            >
              <image :src="opt.image" :class="pageStyle['thumb']" mode="aspectFill"/>
              <view :class="pageStyle['clear-icon-wrapper']" @click.stop="reset">
                <view :class="pageStyle['clear-icon']">×</view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>

</template>

<script setup lang="ts">
import {ref, defineExpose, defineEmits, nextTick, onMounted, onUnmounted} from 'vue';
import pageStyle from './index.module.less';
import {SCENE_OPTIONS, SCENE_TITLE, type ISelectOption, CenterSelectManager} from './const';
import {throttle} from '@/constants/util';

const options = SCENE_OPTIONS;
const title = SCENE_TITLE;
const selected = ref<ISelectOption | null>(SCENE_OPTIONS[0]);
const rightScrollLeft = ref(0);
let centerManager: CenterSelectManager | null = null;

const emit = defineEmits<{ change: [string | null] }>();

const select = (opt: ISelectOption) => {
  selected.value = opt;
  emit('change', opt.name);
  nextTick(handleRightDragEnd)
};

const reset = () => {
  selected.value = SCENE_OPTIONS[0];
  rightScrollLeft.value = 0;
  centerManager?.scrollToIndex(0);
  emit('change', SCENE_OPTIONS[0].name);
};

const getSelectedScene = () => {
  return selected.value;
};

defineExpose({getSelectedScene, reset});

const handleRightScroll = throttle(() => {
  centerManager && centerManager.updateCenter();
}, 150);

const handleRightDragEnd = () => {
  const id = selected.value?.id || ''
  const index = options.findIndex((it) => it.id === id)
  if (index < 0) return
  centerManager && centerManager.scrollToIndex(index)
}

onMounted(() => {
  nextTick(() => {
    centerManager = new CenterSelectManager('#scene-right-scroll', '.' + pageStyle['option-item'], (index: number) => {
      const opt = options[index];
      if (opt && selected.value?.id !== opt.id) {
        selected.value = opt;
        emit('change', opt.name);
      }
    }, (newScrollLeft: number) => {
      rightScrollLeft.value = newScrollLeft;
    });
    centerManager.init();
    centerManager.scrollToIndex(0);
    console.log('doneeee');
  });
})

</script>

<style lang="less" scoped>
</style>
