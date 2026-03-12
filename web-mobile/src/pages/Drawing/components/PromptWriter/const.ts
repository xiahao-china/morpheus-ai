export const PROMPT_TITLE = '提示词'
export const PROMPT_PLACEHOLDER = '请输入提示词，描述您想要生成的内容...'
export const PROMPT_MAX_LENGTH = 500

export class PromptManager {
  private value: string = ''
  constructor(initValue: string = '') {
    this.value = initValue
  }
  update(val: string) {
    this.value = val
  }
  clear() {
    this.value = ''
  }
  get() {
    return this.value
  }
  static clamp(val: string, max: number) {
    return val.length > max ? val.slice(0, max) : val
  }
}

export interface IPromptWriterProps {
  modelValue?: string
  title?: string
  placeholder?: string
  scene?: string
  designStyle?: string
}

export interface IPromptWriterExpose {
  openAIPolish: () => Promise<string>
  clear: () => void
}
