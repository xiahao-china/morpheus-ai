import { httpGet, httpPost } from '@/lib/request/http';

export interface IFengshuiTask {
  taskId: string;
  status: string;
  queueId?: string;
}

export interface IFengshuiTaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export interface IFengshuiReport {
  score: number;
  level: string;
  summary: string;
  items: Array<{
    type: 'danger' | 'warning' | 'success';
    title: string;
    tag: string;
    impact?: string;
    suggestion?: string;
    analysis?: string;
  }>;
}

export interface IFengshuiHistoryItem {
  taskId: string;
  imageUrl: string;
  score: number;
  level: string;
  createdTime: string | Date;
}

interface ICreateFengshuiTaskParams {
  imageId: string;
  houseInfo?: string;
  residentProfile?: string;
  residentNeeds?: string;
}

interface ITaskDetailResponse {
  taskId: string;
  status: 'INITIATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCEL';
  progress: number;
  content?: string;
}

interface IFengshuiHistoryResponse {
  list: Array<{
    imageGenTaskId: string;
    imageUrl?: string;
    underImageUrl?: string;
    createdTime: string | Date;
    content?: string;
  }>;
}

const getReportSection = (content: string, title: string, nextTitle?: string) => {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedNext = nextTitle ? nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const pattern = nextTitle
    ? new RegExp(`${escapedTitle}[\\s\\S]*?(?=${escapedNext})`)
    : new RegExp(`${escapedTitle}[\\s\\S]*$`);
  const matched = content.match(pattern);
  return matched?.[0] || '';
};

const normalizeStatus = (status: ITaskDetailResponse['status']): IFengshuiTaskStatus['status'] => {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'FAILED' || status === 'CANCEL') return 'failed';
  if (status === 'PROCESSING') return 'processing';
  return 'pending';
};

const parseLevel = (score: number) => {
  if (score >= 9) return '上吉';
  if (score >= 8) return '吉';
  if (score >= 6) return '中';
  if (score >= 4) return '平';
  return '凶';
};

const normalizeItemType = (type: unknown): 'danger' | 'warning' | 'success' => {
  if (type === 'danger' || type === 'warning' || type === 'success') return type;
  return 'warning';
};

const parseJsonReport = (content: string): IFengshuiReport | null => {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;
    const rawItems = Array.isArray((parsed as any).items) ? (parsed as any).items : [];
    if (!rawItems.length) return null;
    const score = Math.max(0, Math.min(100, Math.round(Number((parsed as any).score || 0))));
    const level = typeof (parsed as any).level === 'string' ? (parsed as any).level : parseLevel(score);
    const summary = typeof (parsed as any).summary === 'string' ? (parsed as any).summary : '风水分析已完成，请查看下方详细结果。';
    const items: IFengshuiReport['items'] = rawItems.map((item: any) => ({
      type: normalizeItemType(item?.type),
      title: typeof item?.title === 'string' ? item.title : '分析项',
      tag: typeof item?.tag === 'string' ? item.tag : '提示',
      impact: typeof item?.impact === 'string' ? item.impact : '',
      suggestion: typeof item?.suggestion === 'string' ? item.suggestion : '',
      analysis: typeof item?.analysis === 'string' ? item.analysis : ''
    }));
    return { score, level, summary, items };
  } catch {
    return null;
  }
};

const parseMarkdownReport = (content: string): IFengshuiReport => {
  const scoreSection = getReportSection(content, '### 一、风水评分', '### 二、优势分析');
  const scoreMatches = [...scoreSection.matchAll(/\|\s*(整体格局|门窗朝向|功能区域|煞气排查|五行平衡|(?:\*\*)?综合评分(?:\*\*)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|/g)];
  const scoreList = scoreMatches
    .map((item) => Number(item[2]))
    .filter((item) => Number.isFinite(item) && item > 0);
  const score = scoreList.length ? Math.round(scoreList.reduce((acc, cur) => acc + cur, 0) / scoreList.length) : 0;

  const advantageSection = getReportSection(content, '### 二、优势分析', '### 三、问题诊断');
  const advantageList = [...advantageSection.matchAll(/\d+\.\s*(.+)/g)].map((item) => item[1]?.trim()).filter(Boolean);

  const diagnosisSection = getReportSection(content, '### 三、问题诊断', '### 四、优化建议');
  const diagnosisRows = [...diagnosisSection.matchAll(/\|\s*\d+\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g)];

  const suggestionSection = getReportSection(content, '### 四、优化建议', '### 五、特别提醒');
  const suggestionRows = [...suggestionSection.matchAll(/\|\s*\d+\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g)];

  const remindSection = getReportSection(content, '### 五、特别提醒');
  const remindList = [...remindSection.matchAll(/-\s*(.+)/g)].map((item) => item[1]?.trim()).filter(Boolean);

  const items: IFengshuiReport['items'] = [];

  diagnosisRows.forEach((row) => {
    const problemType = row[1]?.trim() || '问题';
    const severity = row[2]?.trim() || '';
    const position = row[3]?.trim() || '';
    const impact = row[4]?.trim() || '';
    const type = severity.includes('高') ? 'danger' : (severity.includes('中') ? 'warning' : 'success');
    items.push({
      type,
      title: `${problemType}${position ? `：${position}` : ''}`,
      tag: severity || '提示',
      impact
    });
  });

  suggestionRows.forEach((row, index) => {
    if (!items[index]) return;
    items[index].suggestion = row[2]?.trim() || '';
  });

  if (!items.length && advantageList.length) {
    advantageList.forEach((item) => {
      items.push({
        type: 'success',
        title: item,
        tag: '优势',
        analysis: item
      });
    });
  }

  const summaryParts = [
    advantageList.length ? `优势：${advantageList.join('；')}` : '',
    remindList.length ? `提醒：${remindList.join('；')}` : ''
  ].filter(Boolean);

  return {
    score,
    level: parseLevel(score),
    summary: summaryParts.join('。') || '风水分析已完成，请查看下方详细结果。',
    items: items.length ? items : [{
      type: 'warning',
      title: '报告结构化提取中',
      tag: '提示',
      analysis: content
    }]
  };
};

export const createFengshuiTask = async (params: ICreateFengshuiTaskParams): Promise<IFengshuiTask> => {
  const res = await httpPost<ICreateFengshuiTaskParams, IFengshuiTask>('/generation/fengshui', params);
  if (res instanceof Error) {
    throw res;
  }
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(res.message || '创建风水任务失败');
  }
  return res.data;
};

export const getFengshuiTaskStatus = async (taskId: string): Promise<IFengshuiTaskStatus> => {
  const res = await httpGet<object, ITaskDetailResponse>(`/image/detail/${taskId}`, {});
  if (res instanceof Error) {
    throw res;
  }
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(res.message || '获取风水任务状态失败');
  }
  return {
    taskId: res.data.taskId,
    status: normalizeStatus(res.data.status),
    progress: Math.max(0, Math.min(100, Number(res.data.progress || 0)))
  };
};

export const getFengshuiReport = async (taskId: string): Promise<IFengshuiReport> => {
  const res = await httpGet<object, ITaskDetailResponse>(`/image/detail/${taskId}`, {});
  if (res instanceof Error) {
    throw res;
  }
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(res.message || '获取风水报告失败');
  }
  if (normalizeStatus(res.data.status) !== 'completed') {
    throw new Error('风水任务尚未完成');
  }
  const content = res.data.content || '';
  if (!content) {
    throw new Error('报告内容为空');
  }
  const jsonReport = parseJsonReport(content);
  if (jsonReport) {
    return jsonReport;
  }
  return parseMarkdownReport(content);
};

export const getFengshuiHistory = async (params?: { page?: number; pageSize?: number }): Promise<IFengshuiHistoryItem[]> => {
  const res = await httpGet<object, IFengshuiHistoryResponse>('/image/history', {
    page: params?.page || 1,
    pageSize: params?.pageSize || 20,
    purpose: 'FENG_SHUI'
  });
  if (res instanceof Error) {
    throw res;
  }
  if (res.code !== 200 || !Array.isArray(res.data?.list)) {
    throw new Error(res.message || '获取风水历史失败');
  }
  return res.data.list.map((item) => {
    const parsedReport = item.content ? (parseJsonReport(item.content) || parseMarkdownReport(item.content)) : null;
    const score = parsedReport?.score || 0;
    const level = parsedReport?.level || parseLevel(score);
    return {
      taskId: item.imageGenTaskId,
      imageUrl: item.imageUrl || item.underImageUrl || '',
      score,
      level,
      createdTime: item.createdTime
    };
  });
};
