import { STATIC_ASSETS_URL } from '@/constants'

export const SERVICES_INTRODUCTION_DATA = [
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',
    title: '一键渲染',
    brief: '人工智能驱动的设计方案',
    description: '传统渲染方式不仅参数设置复杂耗时，漫长的等待过程更让人焦虑，再加上高昂的硬件配置门槛，让创意展示变得困难重重。',
    features: ['极速生图', '局部重绘', '智能清除', '高清放大'],
    image: `${STATIC_ASSETS_URL}/home/LivingRoom1.png`,
    gradient: 'linear-gradient(135deg, #2D5CF2 0%, #1E40AF 100%)'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    title: '高效设计',
    brief: '沉浸式三维空间展示',
    description: '输入文字描述或底图即可快速产出数百种设计方案，AI绘图模式让创意落地速度提升10倍，数秒内生成20+高质量图像方案，准确地将表达转换成视觉图像语音，让设计师灵感爆棚。',
    features: ['生动光影', '真实材质', '自由尺寸', '以图生词'],
    image: `${STATIC_ASSETS_URL}/home/Kitchen1.png`,
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #DC2626 100%)'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
    title: '商务定制',
    brief: '现场设计高效获客',
    description: '在跟客户沟通中，利用推敲，设计师能将自己的设计想法转换成直观的效果图，与客户形成零误差的信息传递，同时，设计师能够在与客户交流中，快速对客户的意见进行回应，现场展示修改效果，促成高效的商务合作。',
    features: ['细节精准把控', '风格个性化', '面对面沟通', '快速反馈',  ],
    image: `${STATIC_ASSETS_URL}/home/Bedroom1.png`,
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #059669 100%)'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
    title: '专业团队',
    brief: '为您提供专业的售后服务',
    description: '我们专业的团队由资深设计师、技术专家和售后客服组成，为设计师、业主和施工团队提供 7x24 小时实时在线协作支持，确保设计理念精准落地，施工过程高效推进，让您的项目无忧进行。',
    features: ['高稳定性', '问题即刻响应', '评论反馈系统', '进度实时跟踪'],
    image: `${STATIC_ASSETS_URL}/home/Bathroom1.png`,
    gradient: 'linear-gradient(135deg, #FFE66D 0%, #F59E0B 100%)'
  }
]
