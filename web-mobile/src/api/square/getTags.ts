import { httpGet } from '@/lib/request/http';

export interface ITag {
  id: number;
  name: string;
  isEnabled: boolean;
}

export interface ITagsResponse {
  styleTags: ITag[];
  sceneTags: ITag[];
}

export const getTags = () => {
  return httpGet<object, ITagsResponse>('/system/config/tags',{});
};
