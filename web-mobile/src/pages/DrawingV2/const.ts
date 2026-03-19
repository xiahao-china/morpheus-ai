import dayjs from "dayjs";
import { EDrawingType } from "@/api/generate/workStream";
import type { IGetGenerationHistoryItem } from "@/api/images/getGenerationHistoryV2";

export interface IDrawingModeOption {
  id: string;
  label: string;
  type: EDrawingType;
}

export type MessageStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type MessageRole = "user" | "service";

export interface IDrawingV2Message {
  id: string;
  role: MessageRole;
  prompt: string;
  mode: IDrawingModeOption;
  status: MessageStatus;
  createdTime: string;
  taskId?: string;
  imageUrl?: string;
  imageId?: string;
  underImageId?: string;
  underImageUrl?: string;
}

export const PAGE_SIZE = 10;

export const DRAWING_MODE_OPTIONS: IDrawingModeOption[] = [
  { id: "inspiration", label: "灵感生图", type: EDrawingType.INSPIRATION },
  { id: "text-to-image", label: "文生图", type: EDrawingType.INSPIRATION },
  { id: "image-to-image", label: "图生图", type: EDrawingType.MAKE_UP },
  { id: "furniture", label: "家具植入", type: EDrawingType.MAKE_UP },
  { id: "style", label: "风格迁移", type: EDrawingType.RENDER_LY },
  { id: "render", label: "光照渲染", type: EDrawingType.LINEAR_RENDER },
];

export const createUserMessage = (
  prompt: string,
  mode: IDrawingModeOption,
  underImageUrl?: string,
): IDrawingV2Message => {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    prompt,
    mode,
    status: "COMPLETED",
    createdTime: dayjs().format("YYYY-MM-DD HH:mm"),
    underImageUrl,
  };
};

export const createPendingServiceMessage = (
  prompt: string,
  mode: IDrawingModeOption,
  underImageId?: string,
  underImageUrl?: string,
): IDrawingV2Message => {
  return {
    id: `service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "service",
    prompt,
    mode,
    status: "PENDING",
    createdTime: dayjs().format("YYYY-MM-DD HH:mm"),
    underImageId,
    underImageUrl,
  };
};

export const mapHistoryToServiceMessages = (
  list: IGetGenerationHistoryItem[],
): IDrawingV2Message[] => {
  return list.flatMap((item, index) => {
    const mode = DRAWING_MODE_OPTIONS[0];
    const timeText = dayjs(item.createdTime).format("YYYY-MM-DD HH:mm");
    const taskId = item.imageGenTaskId || item._id;
    const prompt = item.prompt || "历史生成记录";
    const firstImage = item.images?.[0];

    const userMessage: IDrawingV2Message = {
      id: `history-user-${taskId}-${index}`,
      role: "user",
      prompt,
      mode,
      status: "COMPLETED",
      createdTime: timeText,
      underImageUrl: item.underImageUrl,
    };

    const serviceMessage: IDrawingV2Message = {
      id: `history-service-${taskId}-${index}`,
      role: "service",
      prompt,
      mode,
      status: "COMPLETED",
      createdTime: timeText,
      taskId,
      imageUrl: item.imageUrl || firstImage?.imageUrl || "",
      imageId: item.imageId || firstImage?.imageId,
      underImageUrl: item.underImageUrl,
    };

    return [userMessage, serviceMessage];
  });
};
