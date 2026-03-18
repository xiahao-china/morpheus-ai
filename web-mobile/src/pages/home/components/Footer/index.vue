<template>
  <!-- 使用view替代footer标签，适配小程序 -->
  <view :class="styles.footer">
    <view :class="styles.container">
      <view :class="styles.footerContent">

        <!-- Company Info -->
        <view :class="styles.companyInfo">
          <view :class="styles.logo">
            <image :class="styles.logoIcon" :src="logoImg" mode="aspectFit" />
            <text :class="styles.logoText">暖界AI</text>
          </view>
          <text :class="styles.companyDescription">
            专业的建筑室内技术解决方案提供商，致力于为企业数字化转型提供全方位的技术支持和创新AI服务。
          </text>
          <image :class="styles.companyLogo" :src="companyLogoImg" mode="aspectFit" />
        </view>

        <!-- Services -->
        <view :class="styles.services">
          <text :class="styles.sectionTitle">主要服务</text>
          <view :class="styles.serviceList">
            <view v-for="(service, index) in services" :key="index" :class="styles.serviceItem">
              <view :class="styles.serviceLink" @tap="handleServiceTap(service)">
                <view :class="styles.serviceIcon" v-html="service.icon"></view>
                <text>{{ service.name }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Contact Info -->
        <view :class="styles.contact">
          <text :class="styles.sectionTitle">联系我们</text>
          <view :class="styles.contactInfo">
            <view v-for="(contact, index) in contactInfo" :key="index" :class="styles.contactItem" @tap="handleContactTap(contact)">
              <view :class="styles.contactIcon">
                <component :is="contact.icon"/>
              </view>
              <text>{{ contact.text }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Bottom Bar -->
      <view :class="styles.footerBottom">
        <text :class="styles.copyright">
          © 2025 深圳市星元云创科技有限公司. 版权所有
        </text>
        <view :class="styles.legalLinks">
          <text v-for="(link, index) in legalLinks" :key="index" :class="styles.legalLink" @tap="handleLegalTap(link)">
            {{ link.name }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Taro from '@tarojs/taro';
import { CONTACT_STATIC_INFO } from './const';
import { STATIC_ASSETS_URL } from '@/constants';

// 导入 CSS Module 样式
import styles from './index.module.less';

// 服务数据 - 适配移动端展示
const services = ref([
  {
    name: '云计算服务',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',
    action: 'service'
  },
  {
    name: '企业软件开发',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="16,18 22,12 16,6"></polyline><polyline points="8,6 2,12 8,18"></polyline></svg>',
    action: 'development'
  },
  {
    name: '数据分析',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    action: 'analysis'
  },
  {
    name: '技术咨询',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    action: 'consulting'
  }
]);

const contactInfo = ref(CONTACT_STATIC_INFO);

// 图片资源路径 - 使用Taro兼容的静态资源引用方式
const logoImg = `${STATIC_ASSETS_URL}/logo.png`;
const companyLogoImg = `${STATIC_ASSETS_URL}/company_logo.png`;

// 法律链接数据
const legalLinks = ref([
  { name: '隐私政策', route: '/packageSettings/pages/PrivacyPolicy/index' },
  { name: '服务条款', route: '/packageSettings/pages/ServiceAgreement/index' }
]);

/**
 * 处理服务项点击事件
 * @param service 服务项数据
 */
const handleServiceTap = (service: any) => {
  Taro.showToast({
    title: `了解${service.name}`,
    icon: 'none',
    duration: 1500
  });

  // 可以根据需要跳转到对应的服务页面
  // Taro.navigateTo({
  //   url: `/pages/service/index?type=${service.action}`
  // });
};

/**
 * 处理联系方式点击事件
 * @param contact 联系方式数据
 */
const handleContactTap = (contact: any) => {
  const text = contact.text;

  if (text.includes('@')) {
    // 邮箱地址 - 复制到剪贴板
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  } else if (text.includes('+86') || text.match(/\d{11}/)) {
    // 电话号码 - 拨打电话
    Taro.makePhoneCall({
      phoneNumber: text.replace(/[^\d]/g, '')
    }).catch(() => {
      // 如果拨打失败，复制号码
      Taro.setClipboardData({
        data: text,
        success: () => {
          Taro.showToast({
            title: '号码已复制',
            icon: 'success'
          });
        }
      });
    });
  } else {
    // 地址 - 复制到剪贴板
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({
          title: '地址已复制',
          icon: 'success'
        });
      }
    });
  }
};

/**
 * 处理法律链接点击事件
 * @param link 法律链接数据
 */
const handleLegalTap = (link: any) => {
  if (link.route) {
    Taro.navigateTo({
      url: link.route
    }).catch(() => {
      Taro.showToast({
        title: '页面暂未开放',
        icon: 'none'
      });
    });
  }
};
</script>
