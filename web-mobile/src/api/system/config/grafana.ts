import { httpPost } from '@/lib/request/http';
import { SENTRY_PROJECT_VERSION } from '@/lib/sentry/const';

// 漏斗步骤名（用于 tags.step_name）
// 已移除步骤枚举：使用简化的事件类型即可

// 上报 tags 字段
export interface ReportTags {
  event_type: string;
  version: string;
  env: string;
}

// 上报 fields 字段（保留扩展能力）
export interface ReportFields {
  _value: number;
  // 用户唯一标识
  user_id: string;
  [key: string]: string | number | boolean | null;
}

// 上报载荷结构
export interface ReportPayload {
  measurement: 'ai_design_wx_event' | 'ai_design_wx_mode' | 'ai_design_wx_api_status' | 'ai_design_wx_page';
  tags: ReportTags;
  fields: ReportFields;
  timestamp: number;
}

// 计算环境标签（prod/test）
function resolveEnv(): string {
  return process.env.NODE_ENV;
}

// 统一上报方法：固定 measurement 与 _value，version/env 自动填充
export async function reportEvent(payload: {
  tags: Omit<ReportTags, 'version' | 'env'>;
  fields: Omit<ReportFields, '_value'>;
  timestamp: number;
}) {
  const body: ReportPayload = {
    measurement: 'ai_design_wx_event',
    tags: {
      ...payload.tags,
      version: SENTRY_PROJECT_VERSION,
      env: resolveEnv(),
    },
    fields: {
      _value: 1,
      ...payload.fields,
    } as ReportFields,
    timestamp: payload.timestamp,
  };

  return httpPost<ReportPayload, object>('/metrics/events', body);
}

// 上报事件 -- 上报模式
export async function reportMode(payload: {
  tags: Omit<ReportTags, 'version' | 'env'>;
  fields: Omit<ReportFields, '_value'>;
  timestamp: number;
}) {
  const body: ReportPayload = {
    measurement: 'ai_design_wx_mode',
    tags: {
      ...payload.tags,
      version: SENTRY_PROJECT_VERSION,
      env: resolveEnv(),
    },
    fields: {
      _value: 1,
      ...payload.fields,
    } as ReportFields,
    timestamp: payload.timestamp,
  };

  return httpPost<ReportPayload, object>('/metrics/events', body);
}

// 上报事件 -- API 状态
export async function reportApiStatus(payload: {
  tags: Omit<ReportTags, 'version' | 'env'>;
  fields: Omit<ReportFields, '_value'>;
  timestamp: number;
}) {
  const body: ReportPayload = {
    measurement: 'ai_design_wx_api_status',
    tags: {
      ...payload.tags,
      version: SENTRY_PROJECT_VERSION,
      env: resolveEnv(),
    },
    fields: {
      _value: 1,
      ...payload.fields,
    } as ReportFields,
    timestamp: payload.timestamp,
  };

  return httpPost<ReportPayload, object>('/metrics/events', body);
}

// 上报页面流量
export async function reportPage(payload: {
  tags: Omit<ReportTags, 'version' | 'env'>;
  fields: Omit<ReportFields, '_value'>;
  timestamp: number;
}) {
  const body: ReportPayload = {
    measurement: 'ai_design_wx_page',
    tags: {
      ...payload.tags,
      version: SENTRY_PROJECT_VERSION,
      env: resolveEnv(),
    },
    fields: {
      _value: 1,
      ...payload.fields,
    } as ReportFields,
    timestamp: payload.timestamp,
  };

  return httpPost<ReportPayload, object>('/metrics/events', body);
}
