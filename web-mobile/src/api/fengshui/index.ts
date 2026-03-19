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
  return parseMarkdownReport(content);
};
