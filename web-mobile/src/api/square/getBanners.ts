import { httpGet } from '@/lib/request/http';

export interface IBanner {
  id: number;
  bannerUrl: string;
  path: string;
}

export const getBanners = () => {
  return httpGet<object, IBanner[]>('/system/config/banners', {});
};
