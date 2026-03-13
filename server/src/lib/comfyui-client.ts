/**
 * ComfyUI API 客户端模块
 * 用于与 ComfyUI 服务通信，管理AI图像生成工作流
 */
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { COMFYUI_CONFIG } from "@/config/comfyui";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("ComfyUIClient");

/**
 * ComfyUI API 客户端类
 * 封装了与 ComfyUI 服务交互的各种方法
 */
export class ComfyUIClient {
  private client: AxiosInstance;    // axios 实例
  private baseUrl: string;          // ComfyUI 服务基础URL

  constructor() {
    // 构建 ComfyUI 服务地址
    this.baseUrl = `http://${COMFYUI_CONFIG.host}:${COMFYUI_CONFIG.port}`;
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
      logger.error("Failed to queue prompt:", error.message);
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
      logger.error(`Failed to get history for ${promptId}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取系统状态统计信息
   * 包括队列大小、GPU信息等
   * @returns 系统统计数据
   */
  async getSystemStats() {
    try {
      const response = await this.client.get("/system_stats");
      return response.data;
    } catch (error: any) {
      logger.error("Failed to get system stats:", error.message);
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
      logger.error(`Failed to get image ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * 上传图片到ComfyUI
   * @param fileBuffer - 图片文件的Buffer数据
   * @param filename - 文件名
   * @param type - 文件类型，默认为 "input"
   * @returns 上传结果
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
      logger.error(`Failed to upload image ${filename}:`, error.message);
      throw error;
    }
  }
}

/**
 * ComfyUIClient 单例实例
 */
export const comfyUIClient = new ComfyUIClient();