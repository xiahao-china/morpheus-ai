/**
 * ComfyUI API 客户端模块
 * 用于与 ComfyUI 服务通信，管理AI图像生成工作流
 */
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import WebSocket from "ws";
import { COMFYUI_CONFIG, COMFYUI_NODES, ComfyUINode } from "@/config/comfyui";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("ComfyUIClient");

export enum ComfyUINodeStatus {
  OFFLINE = 'OFFLINE', // 离线
  BUSY = 'BUSY',       // 忙碌
  IDLE = 'IDLE'        // 等待（空闲）
}

export interface ComfyUIExecutionProgress {
  progress: number;
  nodeId: string | null;
  executedNodes: number;
  totalNodes: number;
}

export interface ComfyUIExecutionListenerOptions {
  promptId: string;
  clientId: string;
  totalNodes: number;
  onProgress: (progress: ComfyUIExecutionProgress) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * ComfyUI API 客户端类
 * 封装了与 ComfyUI 服务交互的各种方法
 */
export class ComfyUIClient {
  private client: AxiosInstance;    // axios 实例
  public baseUrl: string;          // ComfyUI 服务基础URL
  public nodeConfig: ComfyUINode;
  public status: ComfyUINodeStatus; // 节点状态

  constructor(node: ComfyUINode) {
    this.nodeConfig = node;
    this.status = ComfyUINodeStatus.IDLE;
    // 构建 ComfyUI 服务地址
    this.baseUrl = `http://${node.host}:${node.port}`;
    // 创建 axios 实例，配置60秒超时，禁用全局代理以防干扰局域网请求
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60s timeout
      proxy: false,   // 禁用环境变量中的 HTTP_PROXY/HTTPS_PROXY
    });
  }

  listenExecutionProgress(options: ComfyUIExecutionListenerOptions): () => void {
    const wsUrl = `${this.nodeConfig.wsProtocol}://${this.nodeConfig.wsHost}:${this.nodeConfig.wsPort}/ws?clientId=${encodeURIComponent(options.clientId)}`;
    const ws = new WebSocket(wsUrl);
    const executedNodeSet = new Set<string>();
    const totalNodes = Math.max(1, options.totalNodes);
    let closed = false;

    const invokeProgress = (nodeId: string | null) => {
      const progress = Math.max(1, Math.min(99, Math.floor((executedNodeSet.size / totalNodes) * 99)));
      Promise.resolve(options.onProgress({
        progress,
        nodeId,
        executedNodes: executedNodeSet.size,
        totalNodes
      })).catch((err) => {
        logger.warn(`[${this.baseUrl}] Failed to handle progress callback: ${err?.message || err}`);
      });
    };

    ws.on("message", (message) => {
      try {
        const payload = JSON.parse(message.toString());
        const eventType = payload?.type;
        const data = payload?.data;
        console.log('message',message);

        if (!data || data.prompt_id !== options.promptId) {
          return;
        }

        if (eventType === "execution_cached") {
          const cachedNodes = Array.isArray(data.nodes) ? data.nodes : [];
          cachedNodes.forEach((node: string | number) => {
            executedNodeSet.add(String(node));
          });
          invokeProgress(null);
          return;
        }

        if (eventType !== "executing") {
          return;
        }

        if (data.node === null) {
          if (options.onComplete) {
            Promise.resolve(options.onComplete()).catch((err) => {
              logger.warn(`[${this.baseUrl}] Failed to handle completion callback: ${err?.message || err}`);
            });
          }
          return;
        }

        executedNodeSet.add(String(data.node));
        invokeProgress(String(data.node));
      } catch (error: any) {
        logger.warn(`[${this.baseUrl}] Failed to parse websocket message: ${error?.message || error}`);
      }
    });

    ws.on("error", (error: Error) => {
      if (options.onError) {
        Promise.resolve(options.onError(error)).catch((callbackError) => {
          logger.warn(`[${this.baseUrl}] Failed to handle websocket error callback: ${callbackError?.message || callbackError}`);
        });
      }
      logger.warn(`[${this.baseUrl}] WebSocket error: ${error.message}`);
    });

    ws.on("close", () => {
      closed = true;
    });

    return () => {
      if (closed) {
        return;
      }
      closed = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }

  /**
   * 将工作流加入队列
   * @param prompt - 工作流JSON对象
   * @param clientId - 客户端ID（可选，用于WebSocket实时推送）
   * @returns ComfyUI 返回的响应数据
   *
   * @example
   * const result = await client.queuePrompt(workflowJson);
   */
  async queuePrompt(prompt: any, clientId?: string) {
    this.status = ComfyUINodeStatus.BUSY;
    try {
      const payload: any = { prompt };
      if (clientId) {
        payload.client_id = clientId;
      } else if (COMFYUI_CONFIG.clientId) {
        payload.client_id = COMFYUI_CONFIG.clientId;
      }

      const response = await this.client.post("/prompt", payload);
      return response.data;
    } catch (error: any) {
      logger.error(`[${this.baseUrl}] Failed to queue prompt:`, error.message);
      this.status = ComfyUINodeStatus.OFFLINE; // 如果请求失败，可能节点离线了
      throw error;
    }
  }

  /**
   * 获取指定prompt的历史记录
   * @param promptId - Prompt ID（从queuePrompt返回获取）
   * @returns 历史记录数据
   */
  async getHistory(promptId: string) {
    try {
      const response = await this.client.get(`/history/${promptId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`[${this.baseUrl}] Failed to get history for ${promptId}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取系统状态统计信息
   * 包括队列大小、GPU信息等
   * @param timeout - 超时时间（毫秒）
   * @returns 系统统计数据
   */
  async getSystemStats(timeout?: number) {
    try {
      const config: any = {};
      if (timeout) config.timeout = timeout;
      
      const response = await this.client.get("/system_stats", config);
      return response.data;
    } catch (error: any) {
      // 降低日志级别或不记录，因为在检测循环中超时是正常的
      // logger.error(`[${this.baseUrl}] Failed to get system stats:`, error.message);
      throw error;
    }
  }

  /**
   * 检查队列是否忙碌
   * 包含当前正在执行和等待的任务
   * @param timeout - 超时时间（毫秒）
   * @returns true 表示忙碌，false 表示空闲
   */
  async getQueueIsBusy(timeout?: number): Promise<boolean> {
    if (this.status === ComfyUINodeStatus.BUSY) {
        return true;
    }

    try {
      const config: any = {};
      if (timeout) config.timeout = timeout;
      
      const response = await this.client.get("/prompt", config);
      
      // 如果能成功获取队列信息，且队列为空，说明节点空闲了
      if (response.data?.exec_info?.queue_remaining === 0) {
          this.status = ComfyUINodeStatus.IDLE;
          return false;
      } else {
          this.status = ComfyUINodeStatus.BUSY;
          return true;
      }
    } catch (error: any) {
      logger.error(`[${this.baseUrl}] Failed to get queue status:`, error.message, error.code || '');
      this.status = ComfyUINodeStatus.OFFLINE;
      throw error;
    }
  }

  /**
   * 获取生成的图片数据
   * @param filename - 图片文件名
   * @param subfolder - 子文件夹名称（可选）
   * @param type - 图片类型，默认为 "output"
   * @returns 图片的二进制数据
   */
  async getImage(filename: string, subfolder?: string, type: string = "output") {
    try {
      const params: any = { filename, type };
      if (subfolder) params.subfolder = subfolder;

      const response = await this.client.get("/view", {
        params,
        responseType: "arraybuffer",  // 以二进制形式接收
      });
      return response.data;
    } catch (error: any) {
      logger.error(`[${this.baseUrl}] Failed to get image ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * 上传图片到 ComfyUI
   * @param fileBuffer - 图片二进制数据
   * @param filename - 文件名
   * @param type - 类型 (input/output/temp)
   */
  async uploadImage(fileBuffer: Buffer, filename: string, type: string = "input") {
    try {
      const form = new FormData();
      form.append("image", fileBuffer, { filename });
      form.append("type", type);
      form.append("overwrite", "true");

      const response = await this.client.post("/upload/image", form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`[${this.baseUrl}] Failed to upload image:`, error.message);
      throw error;
    }
  }
}

class ComfyUIPool {
  private readonly clients: ComfyUIClient[];

  constructor(nodes: ComfyUINode[]) {
    this.clients = nodes.map(node => new ComfyUIClient(node));
  }

  async getAvailableNodes(timeout: number = 2000): Promise<ComfyUIClient[]> {
    const checkPromises = this.clients.map(async (client) => {
      try {
        const isBusy = await client.getQueueIsBusy(timeout);
        return isBusy ? null : client;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(checkPromises);
    return results.filter((client): client is ComfyUIClient => client !== null);
  }
}

export const comfyUIPool = new ComfyUIPool(COMFYUI_NODES);
