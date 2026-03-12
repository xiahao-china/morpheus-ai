import { getScenceChildrenList, type ISceneResponseItem } from '@/api/system/config/getScenceChildrenList.ts';

export interface ISceneModelItem {
  id: string;
  name: string;
  sceneList: ISceneItem[];
}
export interface ISceneItem {
  key: string;
  name: string;
  children: ISceneItem[];
}

export const TREE_PROPS = {
  label: 'name',
  children: 'children'
};

export const DEFAULT_MAIN_SCENE_MODELS = [
  {
    key: '1',
    name: '室内家装',
    children: [
      {
        key: '1-1',
        name: '客厅',
        children: []
      },
      {
        key: '1-2',
        name: '餐厅',
        children: []
      },
      {
        key: '1-3',
        name: '客餐厅',
        children: []
      },
      {
        key: '1-4',
        name: '卧室',
        children: []
      },
      {
        key: '1-5',
        name: '厨房',
        children: []
      },
      {
        key: '1-6',
        name: '书房',
        children: []
      },
      {
        key: '1-7',
        name: '儿童房',
        children: []
      },
      {
        key: '1-8',
        name: '卫生间',
        children: []
      },
      {
        key: '1-9',
        name: '衣帽间',
        children: []
      },
      {
        key: '1-10',
        name: '茶室',
        children: []
      },
      {
        key: '1-11',
        name: '玄关',
        children: []
      },
      {
        key: '1-12',
        name: '屋顶花园',
        children: []
      },
      {
        key: '1-13',
        name: '别墅露台',
        children: []
      },
      {
        key: '1-14',
        name: '家居阳台',
        children: []
      },
      {
        key: '1-15',
        name: '其他',
        children: []
      }
    ]
  },
  {
    key: '2',
    name: '室内公装',
    children: [
      {
        key: '2-1',
        name: '办公空间',
        children: [
          {
            key: '2-1-1',
            name: '前台',
            children: []
          },
          {
            key: '2-1-2',
            name: '会议室',
            children: []
          },
          {
            key: '2-1-3',
            name: '公共办公室',
            children: []
          },
          {
            key: '2-1-4',
            name: '董事长办公室',
            children: []
          },
          {
            key: '2-1-5',
            name: '茶水间',
            children: []
          },
          {
            key: '2-1-6',
            name: '休息区',
            children: []
          },
          {
            key: '2-1-7',
            name: '办公走廊',
            children: []
          },
          {
            key: '2-1-8',
            name: '接待室',
            children: []
          },
          {
            key: '2-1-9',
            name: '工作室',
            children: []
          },
          {
            key: '2-1-10',
            name: '其他',
            children: []
          }
        ]
      }
    ]
  },
  {
    key: '3',
    name: '商业空间',
    children: [
      {
        key: '3-1',
        name: '商场中庭',
        children: []
      },
      {
        key: '3-2',
        name: '书店',
        children: []
      },
      {
        key: '3-3',
        name: '售楼处',
        children: []
      },
      {
        key: '3-4',
        name: '服装店',
        children: []
      },
      {
        key: '3-5',
        name: '超市',
        children: []
      },
      {
        key: '3-6',
        name: '理发店',
        children: []
      },
      {
        key: '3-7',
        name: '洗浴中心',
        children: []
      },
      {
        key: '3-8',
        name: '足浴店会所',
        children: []
      },
      {
        key: '3-9',
        name: '其他',
        children: []
      }
    ]
  },
  {
    key: '4',
    name: '展厅',
    children: [
      {
        key: '4-1',
        name: '科技展厅',
        children: []
      },
      {
        key: '4-2',
        name: '党建展厅',
        children: []
      },
      {
        key: '4-3',
        name: '汽车展厅',
        children: []
      },
      {
        key: '4-4',
        name: '家居展厅',
        children: []
      },
      {
        key: '4-5',
        name: '商业展厅',
        children: []
      },
      {
        key: '4-6',
        name: '文化展厅',
        children: []
      },
      {
        key: '4-7',
        name: '企业展厅',
        children: []
      },
      {
        key: '4-8',
        name: '其他',
        children: []
      }
    ]
  },
  {
    key: '5',
    name: '厂房',
    children: [
      {
        key: '5-1',
        name: '厂房',
        children: []
      },
      {
        key: '5-2',
        name: '操作间',
        children: []
      },
      {
        key: '5-3',
        name: '其他',
        children: []
      }
    ]
  }
]
export const DEFAULT_SCENE_MODELS: ISceneModelItem[] = [
  // {
  //   id: 'FINE_MODEL',
  //   name: '精细模型',
  //   sceneList: DEFAULT_MAIN_SCENE_MODELS
  // },
  {
    id: 'WHITE_MODEL',
    name: '白膜',
    sceneList: []
  },
];

export interface ISceneExpose {
  getSceneValue: () => {
    sceneModelId: string;
    sceneName: string;
  };
  updateSceneValue: (modelId: string, sceneKey: string) => Promise<void>;
  validate: () => boolean;
}

export const getSceneTree = async():Promise<ISceneItem[]> => {
  const response = await getScenceChildrenList();
  if (response instanceof Error || response.code !== 200) {
    console.error('获取场景子列表失败:', response);
    // 返回默认场景数据
    return [];
  }
  const list: ISceneResponseItem[] = response.data as ISceneResponseItem[];

  // 假设 ISceneResponseItem 有 key、name 和 children 属性，将响应数据转换为 ISceneItem 结构
  const convertToSceneItem = (items: ISceneResponseItem[]): ISceneItem[] => {
    return items.map(item => ({
      key: item.id.toString(),
      name: item.value,
      children: convertToSceneItem(item.children || [])
    }));
  };

  return convertToSceneItem(list);
};
