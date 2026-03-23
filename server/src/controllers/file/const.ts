import { Context as KoaContext } from "koa";

export type Context = KoaContext | any;

export const buildFilename = (originalName: string) => `${Date.now()}-${originalName}`;

export const buildObjectPath = (fileType: string | undefined, filename: string) => {
  if (!fileType) return filename;
  return `${fileType.toLowerCase()}/${filename}`;
};
