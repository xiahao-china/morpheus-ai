import type { IGetGenerationHistoryItem } from "@/api/images/getGenerationHistoryV2";
import type { IHistoryCardInfo } from "../HistoryCard/const";
import { calcTaskRatio } from "@/pages/Drawing/const";
import { MODE_LABEL_MAP } from "@/packageHistory/pages/GeneratedDetail/const";
import dayjs from "dayjs";

export const STATUS_TEXT_MAP: Record<string, string> = {
  PENDING: "排队中",
  PROCESSING: "进行中",
  COMPLETED: "已完成",
  FAILED: "失败",
};

export const PAGE_SIZE = 10;

export const mapToCards = (
  records: IGetGenerationHistoryItem[]
): IHistoryCardInfo[] => {
  return records.map((item) => {
    const firstImage = item.images?.[0];
    const imageUrl = item.imageUrl || firstImage?.imageUrl || "";
    const width = item.width || firstImage?.width || 1024;
    const height = item.height || firstImage?.height || 1024;
    return {
      taskId: item.imageGenTaskId,
      type: 'DRAWING' as unknown as IHistoryCardInfo["type"],
      defaultImgId: 0,
      imageUrl,
      ratioText: calcTaskRatio(width, height),
      title: "文生图", // 暂时硬编码，后端模型中没有 type 字段
      statusText: "已完成", // 历史记录通常是已完成的
      desc: item.prompt || "",
      timeText: dayjs(item.createdTime).format(
        "YYYY-MM-DD HH:mm"
      ),
    };
  });
};
