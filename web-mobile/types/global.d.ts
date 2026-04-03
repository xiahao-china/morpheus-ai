/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE 内置环境变量, 会影响到最终构建生成产物 */
    NODE_ENV: 'development' | 'production',
    /** 当前构建的平台 */
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
    /**
     * 当前构建的小程序 appid
     * @description 若不同环境有不同的小程序，可通过在 env 文件中配置环境变量`TARO_APP_ID`来方便快速切换 appid， 而不必手动去修改 dist/project.config.json 文件
     * @see https://taro-docs.jd.com/docs/next/env-mode-config#特殊环境变量-taro_app_id
     */
    TARO_APP_ID: string
  }
}

declare module '@tarojs/components' {
  export * from '@tarojs/components/types/index.vue3'
}

declare module 'element-plus' {
  export type FormItemRule = Record<string, unknown>
  export const ElButton: any
  export const ElCollapse: any
  export const ElCollapseItem: any
  export const ElIcon: any
  export const ElImage: any
  export const ElInfiniteScroll: any
  export const ElMessage: any
  export const ElOption: any
  export const ElPopover: any
  export const ElProgress: any
  export const ElRadioButton: any
  export const ElRadioGroup: any
  export const ElSelect: any
  export const ElSlider: any
  export const ElTag: any
  export const ElTooltip: any
  export const ElTree: any
}

declare module '@vueuse/core' {
  export type Arrayable<T> = T | T[]
}

declare module 'fabric' {
  export const fabric: any
}

declare module 'fabric/fabric-impl' {
  export type Point = any
}

declare module 'react' {
  const React: any
  export = React
}

declare module '@tarojs/plugin-platform-weapp/types/shims-weapp' {}
declare module '@tarojs/taro-rn/types/overlay' {}
