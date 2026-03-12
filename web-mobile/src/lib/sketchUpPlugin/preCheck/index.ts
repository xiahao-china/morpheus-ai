import {SketchUpPlugin} from '@/lib/sketchUpPlugin';

export interface IPreCheckMessage {
  communicated: boolean;
}

export default (modelInfo: IPreCheckMessage, suPlugin: SketchUpPlugin)=>{
  if (modelInfo.communicated) {
    suPlugin.checkSuccess = true;
    console.log('SketchUp 插件通信检查成功, 插件已初始化');
  }
  else console.log('SketchUp 插件未初始化，通信检查失败');

  return modelInfo
}
