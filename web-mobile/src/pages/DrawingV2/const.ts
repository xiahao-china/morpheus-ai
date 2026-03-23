import dayjs from "dayjs";
import { EDrawingType } from "@/api/generate/workStream";
import type { IGetGenerationHistoryItem } from "@/api/images/getGenerationHistoryV2";

export interface IDrawingModeOption {
  id: string;
  label: string;
  type: EDrawingType;
}

export type MessageStatus = "INITIATED" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type MessageRole = "user" | "service";

export interface IDrawingV2Message {
  id: string;
  role: MessageRole;
  prompt: string;
  mode: IDrawingModeOption;
  status: MessageStatus;
  progress?: number;
  isPublished?: boolean;
  createdTime: string;
  taskId?: string;
  imageUrl?: string;
  imageId?: string;
  isLiked?: boolean;
  underImageId?: string;
  underImageUrl?: string;
}

export const PAGE_SIZE = 10;

const normalizeMessageStatus = (status?: string): MessageStatus => {
  const upperStatus = String(status || "").toUpperCase();
  if (upperStatus === "FAILED") return "FAILED";
  if (upperStatus === "COMPLETED") return "COMPLETED";
  if (upperStatus === "PROCESSING") return "PROCESSING";
  if (upperStatus === "INITIATED") return "INITIATED";
  return "PENDING";
};

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
    progress: 0,
    isPublished: false,
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
    const status = normalizeMessageStatus(item.status);

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
      status,
      progress: status === "COMPLETED" ? 100 : Number(item.progress || 0),
      createdTime: timeText,
      taskId,
      imageUrl: item.imageUrl || firstImage?.imageUrl || "",
      imageId: item.imageId || firstImage?.imageId,
      isLiked: Boolean(firstImage?.isLiked),
      isPublished: Boolean(firstImage?.isPublishedToSquare),
      underImageId: item.underImageId,
      underImageUrl: item.underImageUrl,
    };

    return [userMessage, serviceMessage];
  });
};
