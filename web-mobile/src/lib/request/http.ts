import { TaroAdapter } from "axios-taro-adapter";
import { API_URL } from "@/constants";
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { SSEReader } from "./sse";
import { useRequestAuth } from "./interceptors/useRequestAuth";
import { useResponseErrorHandle } from "./interceptors/useResponseErrorHandle";
import { useResponseExpire } from "./interceptors/useResponseExpire";
import { useRequestEmptyFilter } from "./interceptors/useRequestEmptyFilter";
import {handle401ToLogin} from "@/lib/router/config";
import {IObject} from "@/constants/types";
export interface RequestCustomOptions extends AxiosRequestConfig {
  API_URL?: string;
  ignoreError?: boolean;
}

// 创建自定义适配器包装器，确保 headers 是普通对象
const customTaroAdapter = (config: RequestCustomOptions) => {
  // 确保 headers 是普通对象
  if (config.headers) {
    // 如果是 AxiosHeaders 实例，转换为普通对象
    if (typeof config.headers.toJSON === 'function') {
      config.headers = config.headers.toJSON();
    } else {
      config.headers = { ...config.headers };
    }
  }
  // 调用原始的 TaroAdapter
  return TaroAdapter(config);
};

const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 150000,
  adapter: customTaroAdapter,
  withCredentials: true,
});

useRequestEmptyFilter(http);
useResponseExpire(http);
useResponseErrorHandle(http);
useRequestAuth(http);

// 请求返回值类型
export type ApiResponse<T> = {
  code: number;
  msg: string;
  message: string;
  data: T;
};

export const isResponseOK = (status: number) => status >= 200 && status < 300;

export async function httpGet<T = Record<string, unknown>, R = object>(
  url: string,
  params: T,
  options: Omit<RequestCustomOptions, "params"> = {}
): Promise<ApiResponse<R> | Error> {
  const paramsUrl = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return http
    .get<ApiResponse<T>>(`${url}${paramsUrl ? "?" : ""}${paramsUrl || ""}`, {
      ...options,
    })
    .then(
      (res) => {
        if ((res.data as IObject)?.status === 401){
          handle401ToLogin();
        }
        return res.data;
      },
      (err) => err
    );
}

export async function httpPost<T = Record<string, unknown>, R = object>(
  url: string,
  data: T,
  options: Omit<RequestCustomOptions, "data"> = {}
): Promise<ApiResponse<R> | Error> {
  return http
    .post<ApiResponse<T>>(url, data, {
      ...options,
    })
    .then(
      (res) => {
        if ((res.data as IObject)?.status === 401){
          handle401ToLogin();
        }
        return res.data;
      },
      (err) => err
    );
}

// 支持获取完整响应（包括响应头）的 POST 请求函数
export async function httpPostWithHeaders<
  T = Record<string, unknown>,
  R = object
>(
  url: string,
  data: T,
  options: Omit<RequestCustomOptions, "data"> = {}
): Promise<{ data: ApiResponse<R>; headers: Record<string, string> } | Error> {
  return http
    .post<ApiResponse<T>>(url, data, {
      ...options,
    })
    .then(
      (res) => ({
        data: res.data,
        headers: res.headers as Record<string, string>,
      }),
      (err) => err
    );
}

export async function httpPatch<T = Record<string, unknown>, R = object>(
  url: string,
  data: T,
  options: Omit<RequestCustomOptions, "data"> = {}
): Promise<ApiResponse<R> | Error> {
  return http
    .patch<ApiResponse<T>>(`${options.API_URL || API_URL}${url}`, data, {
      ...options,
    })
    .then(
      (res) => res.data,
      (err) => err
    );
}

export async function httpDelete<T = Record<string, unknown>, R = object>(
  url: string,
  params: T,
  options: Omit<RequestCustomOptions, "params"> = {}
): Promise<ApiResponse<R> | Error> {
  return http
    .delete<ApiResponse<T>>(`${options.API_URL || API_URL}${url}`, {
      params,
      ...options,
    })
    .then(
      (res) => {
        if ((res.data as IObject)?.status === 401){
          handle401ToLogin();
        }
        return res.data;
      },
      (err) => err
    );
}

export async function httpPut<T = Record<string, unknown>, R = object>(
  url: string,
  data: T,
  options: Omit<RequestCustomOptions, "data"> = {}
): Promise<ApiResponse<R> | Error> {
  // 如果 options 中有自定义的 API_URL，则临时修改 baseURL
  const config = options.API_URL ? { ...options, baseURL: options.API_URL } : options;

  return http
    .put<ApiResponse<T>>(url, data, config)
    .then(
      (res) => {
        if ((res.data as IObject)?.status === 401){
          handle401ToLogin();
        }
        return res.data;
      },
      (err) => err
    );
}

export async function httpHead<T = Record<string, unknown>, R = object>(
  url: string,
  params: T,
  options: Omit<RequestCustomOptions, "params"> = {}
): Promise<ApiResponse<R> | Error> {
  return http
    .head<ApiResponse<T>>(`${options.API_URL || API_URL}${url}`, {
      params,
      ...options,
    })
    .then(
      (res) => res.data,
      (err) => err
    );
}

// 流式请求拦截器助手函数（内嵌实现）
const addAuthHeaders = async (
  headers: Record<string, string>
): Promise<Record<string, string>> => {
  return headers;
};

const handleStreamResponse = (response: Response): Response => {
  if (!response.ok) {
    // 处理服务器错误
    if (response.status >= 500) {
      console.error(
        "Stream request server error:",
        response.status,
        response.statusText
      );
    }
  }

  return response;
};

const handleStreamError = (error: Error): void => {
  console.error("Stream request error:", error.message);

  // 发送错误事件
  window.dispatchEvent(
    new CustomEvent("request:error", {
      detail: {
        error: error.message,
        source: "stream-request",
      },
    })
  );
};

export async function streamGet<T = Record<string, unknown>, R = object>(
  url: string,
  params: T,
  config?: Omit<AxiosRequestConfig, "params">
): Promise<SSEReader<R> | Error> {
  try {
    // 将参数转换为查询字符串
    const searchParams = new URLSearchParams();
    if (params && typeof params === "object") {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const fullUrl = `${config?.baseURL || API_URL}${url}${
      queryString ? "?" + queryString : ""
    }`;

    // 构建请求头
    let headers: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };

    // 应用认证拦截器
    headers = await addAuthHeaders(headers);

    // 发送请求
    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    // 应用响应拦截器
    const processedResponse = handleStreamResponse(response);

    if (!processedResponse.ok) {
      throw new Error(`HTTP error! status: ${processedResponse.status}`);
    }

    if (!processedResponse.body) {
      throw new Error("Response body is null");
    }

    return new SSEReader<R>(processedResponse.body);
  } catch (err) {
    handleStreamError(err as Error);
    return err as Error;
  }
}

export async function streamPost<T = Record<string, unknown>, R = object>(
  url: string,
  data: T,
  config?: Omit<AxiosRequestConfig, "data">
): Promise<SSEReader<R> | Error> {
  try {
    const fullUrl = `${config?.baseURL || API_URL}${url}`;

    // 构建请求头
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };

    // 应用认证拦截器
    headers = await addAuthHeaders(headers);

    // 发送请求
    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    // 应用响应拦截器
    const processedResponse = handleStreamResponse(response);

    if (!processedResponse.ok) {
      throw new Error(`HTTP error! status: ${processedResponse.status}`);
    }

    if (!processedResponse.body) {
      throw new Error("Response body is null");
    }

    return new SSEReader<R>(processedResponse.body);
  } catch (err) {
    handleStreamError(err as Error);
    return err as Error;
  }
}
