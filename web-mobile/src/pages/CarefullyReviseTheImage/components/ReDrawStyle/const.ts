export enum EReDrawStyle {
  // 原有风格
  ORIGINAL = 'original',
  // 自定义风格
  CUSTOM = 'custom',
}

export const RE_DRAW_STYLERADIO_GROUP = [
  {
    label: '原有风格',
    value: EReDrawStyle.ORIGINAL,
  },
  {
    label: '自定义风格',
    value: EReDrawStyle.CUSTOM,
    disabled: true
  },
]

export interface IReDrawStyleInfo {
  reDrawStyle: EReDrawStyle;
  styleModelId?: number;
  styleExtractionLevelOutward?: number;
}

export interface IReDrawStyleExposed {
  getReDrawStyleInfo: () => IReDrawStyleInfo;
}
