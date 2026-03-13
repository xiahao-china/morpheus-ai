/**
 * ComfyUI API 客户端模块
 * 用于与 ComfyUI 服务通信，管理AI图像生成工作流
 */
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { COMFYUI_CONFIG, COMFYUI_NODES, ComfyUINode } from "@/config/comfyui";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("ComfyUIClient");

/**
 * ComfyUI API 客户端类
 * 封装了与 ComfyUI 服务交互的各种方法
 */
export class ComfyUIClient {
  private client: AxiosInstance;    // axios 实例
  public baseUrl: string;          // ComfyUI 服务基础URL
  public nodeConfig: ComfyUINode;

  constructor(node: ComfyUINode) {
    this.nodeConfig = node;
    // 构建 ComfyUI 服务地址
    this.baseUrl = `http://${node.host}:${node.port}`;
    // 创建 axios 实例，配置60秒超时
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60s timeout
    });
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
   * 获取队列状态
   * 包含当前正在执行和等待的任务
   */
  async getQueue(timeout?: number) {
    try {
      const config: any = {};
      if (timeout) config.timeout = timeout;
      
      const response = await this.client.get("/prompt", config);
      return response.data;
    } catch (error: any) {
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

// 初始化节点池
export const comfyUIPool = COMFYUI_NODES.map(node => new ComfyUIClient(node));

// 默认客户端（指向第一个节点，用于向后兼容）
export const comfyUIClient = comfyUIPool[0];