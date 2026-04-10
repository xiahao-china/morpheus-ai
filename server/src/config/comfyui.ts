import { serverConfig } from "./base";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("ComfyUIConfig");

export interface ComfyUINode {
  host: string;
  port: number;
  wsHost: string;
  wsPort: number;
  protocol: 'http' | 'https';
  wsProtocol: 'ws' | 'wss';
  type: 'normal' | 'super';
}

function createNodes(host: string, ports: number[], type: 'normal' | 'super'): ComfyUINode[] {
  return ports.map(port => ({
    host,
    port,
    wsHost: host,
    wsPort: port,
    protocol: 'http',
    wsProtocol: 'ws',
    type
  }));
}

// 优先从外部配置文件 (如 config.test.json) 加载 ComfyUI 节点
const getNodes = (): ComfyUINode[] => {
  const nodes = serverConfig.comfyui?.nodes;
  if (nodes && Array.isArray(nodes) && nodes.length > 0) {
    logger.info(`[ComfyUI] Loaded ${nodes.length} nodes from configuration file`);
    return nodes;
  }
  
  logger.warn('[ComfyUI] No nodes found in configuration! Task scheduling will be disabled.');
  return [];
};

export const COMFYUI_NODES = getNodes();

// ComfyUI Configuration (Default to the first normal node for backward compatibility)
const defaultNode = COMFYUI_NODES.find(n => n.type === 'normal') || COMFYUI_NODES[0] || {
  host: '127.0.0.1',
  port: 8188,
  wsHost: '127.0.0.1',
  wsPort: 8188,
  protocol: 'http',
  wsProtocol: 'ws'
};

export const COMFYUI_CONFIG = {
  host: defaultNode.host,
  port: defaultNode.port,
  wsHost: defaultNode.wsHost,
  wsPort: defaultNode.wsPort,
  protocol: defaultNode.protocol,
  wsProtocol: defaultNode.wsProtocol,
  clientId: serverConfig.comfyui?.clientId || "morpheus-ai-client",
};
