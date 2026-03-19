import { Context as KoaContext } from "koa";

export type Context = KoaContext | any;

export const DEFAULT_PAGE_NUMBER = 1;
export const DEFAULT_PAGE_SIZE = 20;

export const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
};
