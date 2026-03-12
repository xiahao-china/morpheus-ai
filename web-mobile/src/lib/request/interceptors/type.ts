import type { AxiosInstance } from "axios";

export type useRequestInterceptorsCallback<T extends object = object> = (axios: AxiosInstance, options?: T) => void;
export type useResponseInterceptorsCallback<T extends object = object> = (axios: AxiosInstance, options?: T) => void;