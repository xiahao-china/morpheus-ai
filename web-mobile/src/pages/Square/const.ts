import { getSquareDetail } from '@/api/square/squareDetail';
import type { IWorkBaseInfo } from './components/WorkCard/const';
import {STATIC_ASSETS_URL} from "@/constants";

export const getWorkInfo = async (workId: string): Promise<IWorkBaseInfo | null> => {
  const response = await getSquareDetail(workId);
  if (response instanceof Error || response.code !== 200) {
    console.log(response);
    return null;
  }
  const {data} = response;
  return {
    workId,
    title: data.title,
    workImg: data.squareImage.imageUrl,
    avatar: response.data.avatar || `${STATIC_ASSETS_URL}/default-head-image.png`,
    name: data.username,
    likeCount: data.collectCount,
    hasLike: data.isCollected,
  }
}
