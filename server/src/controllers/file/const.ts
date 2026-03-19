import { Context as KoaContext } from "koa";

export type Context = KoaContext | any;

export const FILE_URL_EXPIRE_SECONDS = 24 * 60 * 60;

export const buildFilename = (originalName: string) => `${Date.now()}-${originalName}`;

export const buildObjectPath = (fileType: string | undefined, filename: string) => {
  if (!fileType) return filename;
  return `${fileType.toLowerCase()}/${filename}`;
};
