import { serverConfig } from "./base";

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

// Development Nodes (Test Environment)
const DEV_NODES: ComfyUINode[] = [
  {
    host: "127.0.0.1",
    port: 4000,
    wsHost: "127.0.0.1",
    wsPort: 4000,
    protocol: 'http',
    wsProtocol: 'ws',
    type: 'normal'
  },
];

// Production Nodes (Formal Environment)
// Extracted from Nginx configuration
const PROD_NODES: ComfyUINode[] = [
  // Normal Nodes
  ...createNodes("192.168.2.82", [4000, 4001, 4002, 4003], 'normal'),
  ...createNodes("192.168.2.83", [4000, 4001, 4002, 4003], 'normal'),

  // Super Nodes (4090)
  ...createNodes("192.168.2.55", [4000, 4001, 4002, 4003, 4004, 4005, 4006], 'super'),
];

export const COMFYUI_NODES = process.env.NODE_ENV === 'production' ? PROD_NODES : DEV_NODES;

// ComfyUI Configuration (Default to the first normal node for backward compatibility)
const defaultNode = COMFYUI_NODES.find(n => n.type === 'normal') || COMFYUI_NODES[0];

export const COMFYUI_CONFIG = {
  host: defaultNode.host,
  port: defaultNode.port,
  wsHost: defaultNode.wsHost,
  wsPort: defaultNode.wsPort,
  protocol: defaultNode.protocol,
  wsProtocol: defaultNode.wsProtocol,
  clientId: serverConfig.comfyui?.clientId || "morpheus-ai-client",
};
