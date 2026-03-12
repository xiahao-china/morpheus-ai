import type { useRequestInterceptorsCallback } from "./type";

export const useRequestEmptyFilter: useRequestInterceptorsCallback = (axios) => {
  axios.interceptors.request.use(
    (config) => {
      const filterParams: Record<string, unknown> = {};
      Object.keys(config.params || {}).forEach((key) => {
        if (config.params[key] !== undefined) {
          filterParams[key] = config.params[key];
        }
      });
      config.params = filterParams;
      return config;
    })
}