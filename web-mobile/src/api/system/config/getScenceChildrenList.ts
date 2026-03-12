import { httpGet } from '@/lib/request/http';

export interface ISceneResponseItem {
  id: number;
  defaultValue: number;
  value: string;
  isEnabled: boolean;
  parentId: number;
  children: null | ISceneResponseItem[];
}

type TSceneResponse = ISceneResponseItem[]

export const getScenceChildrenList = async () => {
  return httpGet<object, TSceneResponse>(`/system/config/menus`, {});
};
