import type { IObject } from '@/constants/types'
import sketchUpPluginRoutes from './routes';

export type TSketchUpPluginMessageHandler =  {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [path: string]: (modelInfo: any, suPlugin: SketchUpPlugin) => any
}

export interface ISendMessageToPlugin {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export class SketchUpPlugin {
  // 由SU插件主动请求的回调列表
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<string, (modelInfo: any, suPlugin: SketchUpPlugin) => any>;

  // 由页面主动发起的请求等待回调列表
  private waitingHandlers: Map<string, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callBack: (data: string) => any,
  }> = new Map();

  public checkSuccess = false;

  constructor() {
    this.handlers = new Map();
    const w = (window as IObject);
    w.onSketchupMessage = (path: string, modelInfo: string) => {
      this.handleMessage(path, modelInfo);
    };
    w.sketchup && w.sketchup.ready && w.sketchup.ready();
  }

  /**
   * 发送消息到 SketchUp
   * @param msg 消息内容
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async asyncSendMessage(msg: ISendMessageToPlugin): Promise<any> {
    const w = (window as IObject);
    w.sketchup && w.sketchup.sendMessage && w.sketchup.sendMessage(msg);
    const data = await new Promise((resolve, reject) => {
      this.waitingHandlers.set(msg.path, {
        callBack: (data: string)=>{
          try {
            const handleData = JSON.parse(data);
            resolve(handleData);
          } catch (error) {
            console.error('SketchUp 插件消息处理错误:', error);
            reject(error);
          }
        },
      });
    });
    return data as string;
  }

  private handleMessage(path: string, modelInfo: string) {
    const handler = this.handlers.get(path);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    if (handler) {
      try {
        const modelInfoObj = JSON.parse(modelInfo);
        handler(modelInfoObj, that);
      }catch (error) {
        console.error('SketchUp 插件消息处理错误:', error);
      }
    }
    const waitingHandler = this.waitingHandlers.get(path);
    if (waitingHandler) {
      waitingHandler.callBack(modelInfo);
      this.waitingHandlers.delete(path);
    }
  }

  initRoutes(routes: TSketchUpPluginMessageHandler) {
    Object.keys(routes).forEach((path: string) => {
      this.handlers.set(path, routes[path]);
    })
  }

  push(path: string, handler: (modelInfo: string) => void) {
    this.handlers.set(path, handler);
  }
}

// 初始化实例
const sketchupPluginObj = new SketchUpPlugin();
sketchupPluginObj.initRoutes(sketchUpPluginRoutes);

export default sketchupPluginObj
