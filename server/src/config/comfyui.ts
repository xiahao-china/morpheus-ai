import { serverConfig } from "./base";

// ComfyUI Configuration
export const COMFYUI_CONFIG = {
  host: serverConfig.comfyui?.host || "127.0.0.1",
  port: serverConfig.comfyui?.port || 8188,
  wsHost: serverConfig.comfyui?.wsHost || "127.0.0.1",
  wsPort: serverConfig.comfyui?.wsPort || 8188,
  clientId: serverConfig.comfyui?.clientId || "morpheus-ai-client",
};
