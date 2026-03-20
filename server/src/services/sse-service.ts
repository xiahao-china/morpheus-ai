import { PassThrough } from "stream";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("SSEService");

// SSE连接接口
interface SSEConnection {
  id: string;
  stream: PassThrough;
}

// SSE服务类
class SSEService {
  // 连接池：存储所有活跃的SSE连接
  private connections: Map<string, SSEConnection>;

  constructor() {
    this.connections = new Map();
  }

  /**
   * 添加新的SSE连接
   * @param id 连接ID（如用户ID或会话ID）
   * @returns 用于响应的PassThrough流
   */
  public addConnection(id: string): PassThrough {
    const stream = new PassThrough();
    this.connections.set(id, { id, stream });

    logger.info(`SSE连接已添加: ${id}`);

    // 心跳保活定时器（每15秒发送一次）
    const interval = setInterval(() => {
      stream.write(`: keep-alive\n\n`);
    }, 15000);

    // 连接关闭时清理资源
    stream.on("close", () => {
      clearInterval(interval);
      this.connections.delete(id);
      logger.info(`SSE连接已关闭: ${id}`);
    });

    return stream;
  }

  /**
   * 向指定连接发送事件
   * @param id 连接ID
   * @param event 事件名称
   * @param data 事件数据
   */
  public send(id: string, event: string, data: any) {
    const connection = this.connections.get(id);
    if (connection) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.stream.write(message);
    }
  }

  /**
   * 向所有连接广播事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.connections.forEach((connection) => {
      connection.stream.write(message);
    });
  }
}

export const sseService = new SSEService();
