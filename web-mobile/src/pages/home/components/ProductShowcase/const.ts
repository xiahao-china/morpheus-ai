import { STATIC_ASSETS_URL } from '@/constants'

export const CATEGORIES_STATIC_DATA = [
  {
    id: 'living',
    name: '客厅',
  },
  {
    id: 'bedroom',
    name: '卧室',
  },
  {
    id: 'kitchen',
    name: '餐厅',
  },
  {
    id: 'bathroom',
    name: '浴室',
  },
]

export interface IImagesStaticData {
  url: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
}

export const ALL_IMAGES_STATIC_DATA:IImagesStaticData[] = [
  // Living Room
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom1.png`,
    title: '现代简约客厅',
    category: 'living',
    tags: ['现代风', '简约布局', '明亮通透'],
    description: '现代简约风格的客厅，以简洁布局搭配明亮色彩，营造出舒适又通透的空间氛围。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom2.png`,
    title: '古典中式客厅',
    category: 'living',
    tags: ['中式古典', '传统韵味', '自然和谐'],
    description: '古典中式风格客厅，融入传统元素与自然材质，展现出独特的东方韵味与和谐美感。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom3.png`,
    title: '现代简约客厅',
    category: 'living',
    tags: ['工业风', '个性装饰', '时尚潮流'],
    description: '工业风格的现代简约客厅，个性装饰与时尚元素完美融合，彰显独特品味。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom4.png`,
    title: '奢华客厅',
    category: 'living',
    tags: ['奢华大气', '典雅风范', '精致细节'],
    description: '奢华典雅的客厅空间，注重每一处精致细节，尽显大气风范与尊贵品味。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom5.png`,
    title: '现代极简客厅',
    category: 'living',
    tags: ['极简主义', '纯粹空间', '高端质感'],
    description: '现代极简风格客厅，以纯粹的空间设计和高端质感，诠释极致简约之美。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/LivingRoom6.png`,
    title: '现代简约客厅',
    category: 'living',
    tags: ['轻奢风格', '优雅格调', '舒适温馨'],
    description: '轻奢风的现代简约客厅，优雅格调与舒适温馨并存，打造高品质生活空间。',
  },

  // Bedroom
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom1.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['温馨色调', '舒适睡眠', '放松氛围'],
    description: '温馨色调的卧室，营造出舒适的睡眠环境，让您每晚都能尽情放松身心。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom2.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['柔软质感', '宁静空间', '温馨港湾'],
    description: '拥有柔软质感的卧室，打造宁静的私人空间，是您疲惫的心灵温馨港湾。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom3.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['暖光氛围', '舒适软装', '惬意休憩'],
    description: '暖光氛围的卧室，搭配舒适软装，为您提供惬意的休憩之所。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom4.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['自然元素', '温馨舒适', '健康睡眠'],
    description: '融入自然元素的卧室，温馨舒适又有益于健康睡眠，让您焕发活力。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom5.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['柔和色彩', '放松身心', '甜蜜梦乡'],
    description: '柔和色彩的卧室，帮助您放松身心，轻松进入甜蜜梦乡。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bedroom6.png`,
    title: '温馨卧室',
    category: 'bedroom',
    tags: ['温馨装饰', '舒适床品', '优质睡眠'],
    description: '充满温馨装饰的卧室，搭配舒适床品，保障您的优质睡眠。',
  },

  // Kitchen
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen1.png`,
    title: '法式风餐厅',
    category: 'kitchen',
    tags: ['法式浪漫', '精致烹饪', '优雅用餐'],
    description: '法式风格的餐厅，浪漫氛围与精致烹饪相结合，带来优雅的用餐体验。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen2.png`,
    title: '公装餐厅',
    category: 'kitchen',
    tags: ['现代公装', '高效运营', '整洁环境'],
    description: '现代化公装设计的餐厅，注重高效运营与整洁环境，满足商务用餐需求。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen3.png`,
    title: '公装餐厅',
    category: 'kitchen',
    tags: ['时尚公装', '宽敞空间', '舒适就餐'],
    description: '时尚公装风格的餐厅，宽敞空间与舒适环境，为您带来愉悦的就餐体验。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen4.png`,
    title: '现代餐厅',
    category: 'kitchen',
    tags: ['现代设计', '高效厨房', '美味佳肴'],
    description: '现代设计的餐厅，高效厨房保障美味佳肴的供应，满足您的味蕾需求。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen5.png`,
    title: '公装餐厅',
    category: 'kitchen',
    tags: ['专业公装', '卫生标准', '品质餐饮'],
    description: '专业公装打造的餐厅，严格遵循卫生标准，提供高品质餐饮服务。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Kitchen6.png`,
    title: '公装餐厅',
    category: 'kitchen',
    tags: ['实用公装', '合理布局', '便捷用餐'],
    description: '实用公装设计的餐厅，合理布局带来便捷用餐体验，适合各类人群。',
  },

  // Bathroom
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom1.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['现代简约', '功能齐全', '舒适洗浴'],
    description: '现代简洁风格的浴室，功能齐全，为您打造舒适的洗浴空间。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom2.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['奢华浴室', '放松享受', '私人SPA'],
    description: '奢华的现代浴室，提供放松享受的私人SPA体验，让您舒缓身心。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom3.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['高端配置', '舒适泡澡', '身心舒缓'],
    description: '配置高端的现代浴室，舒适的泡澡环境，帮助您舒缓身心压力。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom4.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['时尚设计', '享受洗浴', '品质生活'],
    description: '时尚设计的现代浴室，让您享受洗浴的乐趣，提升生活品质。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom5.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['精致浴室', '放松身心', '愉悦体验'],
    description: '精致的现代浴室，帮助您放松身心，带来愉悦的洗浴体验。',
  },
  {
    url: `${STATIC_ASSETS_URL}/home/Bathroom6.png`,
    title: '现代浴室',
    category: 'bathroom',
    tags: ['智能设施', '舒适洗浴', '科技生活'],
    description: '配备智能设施的现代浴室，舒适洗浴与科技生活完美结合。',
  },
]
