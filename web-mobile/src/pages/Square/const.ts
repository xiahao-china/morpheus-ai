import { getSquareDetail } from '@/api/square/squareDetail';
import type { IWorkBaseInfo } from './components/WorkCard/const';
import defaultAvatar from '@/assest/image/default-head-image.png';
import { makeUrlAbsolute } from '@/util/url';

export const getWorkInfo = async (workId: string): Promise<IWorkBaseInfo | null> => {
  const response = await getSquareDetail(workId);
  if (response instanceof Error || response.code !== 200) {
    console.log(response);
    return null;
  }
  const {data} = response;
  // 优先使用压缩图
  const workImg = data.squareImage.url256 || data.squareImage.imageUrl || '';
  return {
    workId,
    title: data.title,
    workImg: makeUrlAbsolute(workImg),
    avatar: makeUrlAbsolute(data.avatar || defaultAvatar),
    name: data.username,
    likeCount: data.collectCount,
    hasLike: data.isCollected,
  }
}
