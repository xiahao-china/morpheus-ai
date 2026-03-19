import { Context as KoaContext } from "koa";

export type Context = KoaContext | any;

export const parseTags = (value: unknown) => {
  if (!value) return [];
  return String(value).split(",").filter((tag) => tag.trim());
};

export const buildSquareFilter = (styleTags: unknown, sceneTags: unknown) => {
  const filter: any = {};
  const styleTagList = parseTags(styleTags);
  const sceneTagList = parseTags(sceneTags);

  if (styleTagList.length > 0) {
    filter.styleTags = { $in: styleTagList };
  }

  if (sceneTagList.length > 0) {
    filter.sceneTags = { $in: sceneTagList };
  }

  return filter;
};

export const getNextLikeCount = (action: string, currentCount: number) => {
  if (action === "like") return currentCount + 1;
  return Math.max(0, currentCount - 1);
};
