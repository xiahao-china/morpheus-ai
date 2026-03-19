export interface IPublishSquareDialogProps {
  visible: boolean;
  imageUrl?: string;
  confirmLoading?: boolean;
}

export interface IPublishSquarePayload {
  title: string;
  caption: string;
  styleTags: string[];
  sceneTags: string[];
}

export const STYLE_TAGS = [
  "现代简约",
  "北欧木",
  "极简主义",
  "侘寂风",
  "工业风",
  "日式",
  "法式复古",
  "欧式",
];

export const SCENE_TAGS = [
  "客厅",
  "卧室",
  "书房",
  "餐厅",
  "玄关",
  "厨房",
  "卫生间",
  "阳台",
];
