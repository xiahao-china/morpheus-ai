<template>
  <div :class="styles.wordLibrary">
    <nut-button
      :class="styles.button"
      size="normal"
      type="primary"
      @click="openWordLibrary"
    >
      词库
    </nut-button>
  </div>
</template>

<script setup lang="ts">
import styles from './WordLibrary.module.less'
// 词库组件 - 点击后弹出词库选择弹层

// 打开词库弹层的方法
const openWordLibrary = () => {
  console.log('打开词库弹层')
  // 这里后续会实现弹层逻辑
}
</script>


