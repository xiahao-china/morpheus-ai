export interface ILoadingProps {
  visible?: boolean
  text?: string
  blur?: boolean
}

export const defaultLoadingProps: Required<ILoadingProps> = {
  visible: true,
  text: 'LOADING',
  blur: true,
}

