import type { IDrawingModeOption } from "@/pages/DrawingV2/const";

export interface IBottomDialogProps {
  modeOptions: IDrawingModeOption[];
  generating: boolean;
}

export interface IDrawingSubmitPayload {
  prompt: string;
  mode: IDrawingModeOption;
  underImageId?: string;
  underImageUrl?: string;
}
