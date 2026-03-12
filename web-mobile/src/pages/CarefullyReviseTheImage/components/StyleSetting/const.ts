import type { Ref } from 'vue';

export interface IStyleSettingProps {
  concreteSceneId?: number;
}

export interface IStyleSettingExpose {
  getStyleModelSelectedInfo: ()=>{
    selectedStyleModel: number | undefined;
    referenceStrength: number;
  }
  updateStyleModelSelectedInfo: (styleModelId?: number | string, referenceStrength?: number, wait?: boolean) => void;
  validate: ()=>boolean;
}
