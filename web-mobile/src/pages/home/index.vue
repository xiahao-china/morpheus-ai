<template>
  <Layouts>
    <view class="index">
      <view class="section">
        <Hero></Hero>
      </view>
      <view class="section">
        <ProductShowcase></ProductShowcase>
      </view>
      <view class="section">
        <Services />
      </view>
      <view class="section">
        <Stats />
      </view>
      <view class="section">
        <Footer />
      </view>
    </view>
  </Layouts>
</template>

<script setup lang="ts">
import Layouts from "@/components/Layouts/index.vue";
import Hero from "./components/Hero/index.vue";
import ProductShowcase from "./components/ProductShowcase/index.vue";
import Services from "./components/Services/index.vue";
import Stats from "./components/Stats/index.vue";
import Footer from "./components/Footer/index.vue";

definePageConfig({
  enableShareAppMessage: true,
  enableShareTimeline: true,
})
</script>
