import type { IDrawingV2Message } from "@/pages/DrawingV2/const";

export interface IInfiniteConversationProps {
  messages: IDrawingV2Message[];
  loading: boolean;
  loadEnd: boolean;
}
