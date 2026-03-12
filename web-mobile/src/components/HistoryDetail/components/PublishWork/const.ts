// 标签类型枚举
import { getTags } from '@/api/square/getTags';
import type { IHistoryTaskInfo } from '@/components/HistoryDetail/const';
import type { FormItemRule } from 'element-plus';
import type { Arrayable } from '@vueuse/core';

export enum TagType {
  STYLE = 'style',
  SCENE = 'scene'
}

export interface IPublishWorkProps {
  taskInfo:IHistoryTaskInfo;
  currentIndex:number;
}

// 默认风格标签
export const defaultStyleTags: IPublishWorkTag[] = [
  { id: 'style-1', name: '现代风格', type: TagType.STYLE },
  { id: 'style-2', name: '轻奢风', type: TagType.STYLE },
  { id: 'style-3', name: '极简主义', type: TagType.STYLE },
  { id: 'style-4', name: '工业风', type: TagType.STYLE },
  { id: 'style-5', name: '奶油风', type: TagType.STYLE },
  { id: 'style-6', name: '法式风', type: TagType.STYLE },
  { id: 'style-7', name: '复古风', type: TagType.STYLE },
  { id: 'style-8', name: '新中式', type: TagType.STYLE }
];

// 默认场景标签
export const defaultSceneTags: IPublishWorkTag[] = [
  { id: 'scene-1', name: '前台', type: TagType.SCENE },
  { id: 'scene-2', name: '会议室', type: TagType.SCENE },
  { id: 'scene-3', name: '公共办公室', type: TagType.SCENE },
  { id: 'scene-4', name: '董事长办公室', type: TagType.SCENE },
  { id: 'scene-5', name: '茶水间', type: TagType.SCENE },
  { id: 'scene-6', name: '休息区', type: TagType.SCENE },
  { id: 'scene-7', name: '办公走廊', type: TagType.SCENE },
  { id: 'scene-8', name: '商场中庭', type: TagType.SCENE },
  { id: 'scene-9', name: '书店', type: TagType.SCENE },
  { id: 'scene-10', name: '展厅', type: TagType.SCENE },
  { id: 'scene-11', name: '厂房', type: TagType.SCENE },
  { id: 'scene-12', name: '操作间', type: TagType.SCENE },
];

// 标签接口定义
export interface IPublishWorkTag {
  id: string;
  name: string;
  type: TagType;
  canDelete?: boolean;
}

// 表单数据接口
export interface PublishFormData {
  title: string;
  description: string;
  styleTags: string[];
  sceneTags: string[];
}

// 本地存储键名
export const LOCAL_STORAGE_KEY = 'publishCustomTags';

// 表单验证规则
export const formRules: Partial<Record<string, Arrayable<FormItemRule>>> = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 20, message: '标题不能超过20个字符', trigger: 'blur' }
  ],
  description: [
    { max: 100, message: '描述不能超过100个字符', trigger: 'blur' }
  ],
  styleTags: [
    { required: true, message: '请选择风格标签' , trigger: 'none'},
    { type: 'array', required: false, message: '请选择风格标签', trigger: 'change' }
  ],
  sceneTags: [
    { required: true, message: '请选择场景标签' , trigger: 'none'},
    { type: 'array', required: false, message: '请选择场景标签', trigger: 'change' }
  ]
};

// 获取本地存储的自定义标签
export const getCustomTags = (): IPublishWorkTag[] => {
  try {
    const tagsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    return tagsJson ? JSON.parse(tagsJson) : [];
  } catch (error) {
    console.error('Failed to get custom tags from localStorage:', error);
    return [];
  }
};

// 保存自定义标签到本地存储
export const saveCustomTag = (tag: IPublishWorkTag): void => {
  try {
    const tags = getCustomTags();
    // 避免重复添加
    if (!tags.some(t => t.name === tag.name && t.type === tag.type)) {
      tags.push(tag);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tags));
    }
  } catch (error) {
    console.error('Failed to save custom tag to localStorage:', error);
  }
};

export const deleteCustomTagAndSave = (tag: IPublishWorkTag): void => {
  try {
    const tags = getCustomTags();
    const index = tags.findIndex(t => t.name === tag.name && t.type === tag.type);
    if (index !== -1) {
      tags.splice(index, 1);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tags));
    }
  } catch (error) {
    console.error('Failed to delete custom tag from localStorage:', error);
  }
}

export const getTagList = async ()=>{
  const response = await getTags();
  if (response instanceof Error || response.code!== 200) {
    console.log(response);
    return {
      styleTags: [],
      sceneTags: [],
    };
  }
  const customTags = getCustomTags();
  const styleTags:IPublishWorkTag[] = response.data.styleTags.filter((item)=>item.isEnabled).map((tag) => ({
    id: tag.id.toString(),
    name: tag.name,
    type: TagType.STYLE,
  }));
  styleTags.push(...customTags.filter((item)=>item.type === TagType.STYLE));
  const sceneTags:IPublishWorkTag[] = response.data.sceneTags.filter((item)=>item.isEnabled).map((tag) => ({
    id: tag.id.toString(),
    name: tag.name,
    type: TagType.SCENE,
  }));
  sceneTags.push(...customTags.filter((item)=>item.type === TagType.SCENE));
  return {
    styleTags: styleTags,
    sceneTags: sceneTags,
  }
}
