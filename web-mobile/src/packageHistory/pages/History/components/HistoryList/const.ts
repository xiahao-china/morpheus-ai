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
  return records.flatMap((item) => {
    const images = item.generatedImages.length
      ? item.generatedImages
      : item.editedGeneratedImages;
    if (!images || !images.length) return [];
    const first = images[0];
    return [
      {
        taskId: item.id.toString(),
        type: item.type as unknown as IHistoryCardInfo["type"],
        defaultImgId: first.id,
        imageUrl:
          first.recordThumbnailUrl || first.thumbnailUrl || first.imageUrl,
        ratioText: calcTaskRatio(first.width || 1024, first.height || 1024),
        title: MODE_LABEL_MAP[item.type] || "未知模式",
        statusText: STATUS_TEXT_MAP[item.status] || item.status,
        desc: item.prompt || "",
        timeText: dayjs(item.createdTime || item.startedTime || "").format(
          "YYYY-MM-DD HH:mm"
        ),
      },
    ];
  });
};
