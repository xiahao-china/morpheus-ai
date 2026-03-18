import axios from '@/lib/axios';

export interface IFengshuiTask {
  taskId: string;
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

// 模拟创建风水检测任务
export const createFengshuiTask = (imageUrl: string): Promise<IFengshuiTask> => {
  // TODO: Replace with real API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ taskId: `fs_${Date.now()}` });
    }, 1000);
  });
};

// 模拟查询风水检测进度
export const getFengshuiTaskStatus = (taskId: string): Promise<IFengshuiTaskStatus> => {
  // TODO: Replace with real API
  // 这里做一个简单的模拟进度自增
  return new Promise((resolve) => {
    // 实际场景中应该是后端返回进度
    // 前端轮询或者WebSocket
    resolve({
      taskId,
      status: 'processing', // 永远 processing，前端自己模拟进度条动画
      progress: 0
    });
  });
};

// 模拟获取风水检测报告
export const getFengshuiReport = (taskId: string): Promise<IFengshuiReport> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        score: 88,
        level: '上吉',
        summary: '您的房间整体气场稳定，采光充足，符合“藏风聚气”的基本原则，仅需局部微调即可达到最佳状态。',
        items: [
          {
            type: 'danger',
            title: '门冲煞：入户门对卫生间',
            tag: '严重',
            impact: '财气易流失，湿气直冲玄关，影响居住者健康。',
            suggestion: '在玄关处设置实木屏风或悬挂长帘，阻断气流直冲。'
          },
          {
            type: 'warning',
            title: '靠山不实：床头靠窗',
            tag: '中等',
            impact: '缺乏安全感，睡眠质量波动，事业运势不稳。',
            suggestion: '尽量将床头靠向实墙。若无法移动，请使用厚重的遮光帘并保持窗户常闭。'
          },
          {
            type: 'success',
            title: '明堂开阔：采光极佳',
            tag: '优异',
            analysis: '客厅采光充足，阳气旺盛，有利于家庭和谐与事业上升。'
          }
        ]
      });
    }, 500);
  });
};
