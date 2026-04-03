import { API_URL } from "@/constants";

/**
 * 将相对 URL 转换为绝对 URL，以便在微信小程序中正常显示。
 * @param url 相对路径，如 /uploads/image.png
 * @returns 绝对 URL，如 https://libuli.top/uploads/image.png
 */
export const makeUrlAbsolute = (url?: string) => {
  if (!url) return "";
  // 如果已经是绝对路径，则直接返回
  if (/^https?:\/\//i.test(url)) return url;
  // 获取基础域名部分 (去掉 /api/v1)
  const base = API_URL.replace(/\/api\/v1$/, "");
  // 拼接
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};
