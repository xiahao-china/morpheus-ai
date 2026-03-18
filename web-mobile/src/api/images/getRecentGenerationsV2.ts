import { httpGet } from '@/lib/request/http';
import {
  EFunctionGroupMode
} from '@/pages/CarefullyReviseTheImage/components/FunctionGroup/const'

interface RecentGenerationImage {
  id: number;
  userId: number;
  imageGenerationId: number;
  fileResourceId: number;
  imageUrl: string;
  thumbnailUrl: string;
  recordThumbnailUrl: string;
  width: number;
  height: number;
  createdTime: string;
  updatedTime: string;
  fileResource?: unknown;
}


interface RecentGenerationV2Record {
  _id: string;
  userId: string;
  imageGenTaskId: string;
  imageUrl: string;
  width: number;
  height: number;
  createdTime: string;
}

interface RecentGenerationsResponse {
  list: RecentGenerationV2Record[];
  total: number;
}

export const getRecentGenerationsV2 = async () => {
  return httpGet<object, { list: RecentGenerationV2Record[], total: number }>('/image/history', {
    page: 1,
    pageSize: 20
  });
};

export type { RecentGenerationV2Record, RecentGenerationImage, RecentGenerationsResponse };
