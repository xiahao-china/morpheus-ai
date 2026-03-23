<template>
  <Layouts>
    <view :class="styles.container" v-if="report">
      <!-- Score Card -->
      <view :class="styles.scoreCard">
        <view :class="styles.scoreCircle">
          <view :class="styles.scoreValue">{{ report.score }}</view>
          <view :class="styles.scoreLabel">综合评分</view>
        </view>
        <view :class="styles.resultTitle">
          风水格局：<text :class="styles.level">{{ report.level }}</text>
        </view>
        <view :class="styles.resultDesc">{{ report.summary }}</view>
      </view>

      <!-- Analysis Section -->
      <view :class="styles.sectionHeader">
        <view :class="styles.title">AI 核心分析结果</view>
        <view :class="styles.tag">已深度扫描</view>
      </view>

      <view :class="styles.analysisList">
        <view
          v-for="(item, index) in report.items"
          :key="index"
          :class="styles.analysisCard"
        >
          <view :class="[styles.iconWrapper, styles[item.type]]">
            <template v-if="item.type === 'danger'">!</template>
            <template v-else-if="item.type === 'warning'">?</template>
            <template v-else>✓</template>
          </view>

          <view :class="styles.content">
            <view :class="styles.header">
              <view :class="styles.title">{{ item.title }}</view>
              <view :class="[styles.tag, styles[item.type]]">{{ item.tag }}</view>
            </view>

            <template v-if="item.analysis">
              <view :class="styles.row">
                <text :class="styles.label">解析：</text>{{ item.analysis }}
              </view>
            </template>

            <template v-else>
              <view :class="styles.row" v-if="item.impact">
                <text :class="styles.label">影响：</text>{{ item.impact }}
              </view>
              <view :class="styles.row" v-if="item.suggestion">
                <text :class="styles.label">建议：</text>{{ item.suggestion }}
              </view>
            </template>
          </view>
        </view>
      </view>

      <!-- Bottom Action -->
      <view :class="styles.bottomAction" @tap="handlePurchase">
        获取完整化解方案 (19.9元)
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Taro, { useRouter } from '@tarojs/taro';
import Layouts from '@/components/Layouts/index.vue';
import { getFengshuiReport, IFengshuiReport } from '@/api/fengshui';
import styles from './index.module.less';

const router = useRouter();
const report = ref<IFengshuiReport | null>(null);

const fetchReport = async (taskId: string) => {
  try {
    const res = await getFengshuiReport(taskId);
    report.value = res;
  } catch (err) {
    Taro.showToast({ title: '报告生成中，正在跳转', icon: 'none' });
    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/Fengshui/Progress/index?taskId=${taskId}`
      });
    }, 700);
  }
};

const handlePurchase = () => {
  Taro.showToast({ title: '调起支付...', icon: 'none' });
};

onMounted(() => {
  const taskId = router.params.taskId;
  if (taskId) {
    fetchReport(taskId);
  }
});
</script>
