import { PassThrough } from "stream";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("SSEService");

interface SSEConnection {
  id: string;
  stream: PassThrough;
}

class SSEService {
  private connections: Map<string, SSEConnection> = new Map();

  /**
   * Add a new SSE connection
   * @param id Connection ID (e.g., user ID or custom session ID)
   * @returns PassThrough stream for the response
   */
  public addConnection(id: string): PassThrough {
    const stream = new PassThrough();
    this.connections.set(id, { id, stream });
    
    logger.info(`SSE Connection added: ${id}`);
    
    // Keep-alive interval
    const interval = setInterval(() => {
      stream.write(`: keep-alive\n\n`);
    }, 15000);

    // Clean up on close
    stream.on("close", () => {
      clearInterval(interval);
      this.connections.delete(id);
      logger.info(`SSE Connection closed: ${id}`);
    });

    return stream;
  }

  /**
   * Send an event to a specific connection
   * @param id Connection ID
   * @param event Event name
   * @param data Event data
   */
  public send(id: string, event: string, data: any) {
    const connection = this.connections.get(id);
    if (connection) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.stream.write(message);
    }
  }

  /**
   * Broadcast an event to all connections (optional utility)
   */
  public broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const connection of this.connections.values()) {
      connection.stream.write(message);
    }
  }
}

export const sseService = new SSEService();
