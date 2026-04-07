export interface IInfiniteScrollProps {
  loading?: boolean;
  loadEnd?: boolean;
  direction?: 'up' | 'down';
  customClass?: string;
  scrollTop?: number;
  scrollIntoView?: string;
}

export const defaultInfiniteScrollProps = {
  loading: false,
  loadEnd: false,
  direction: 'up',
  customClass: '',
  scrollTop: 0,
  scrollIntoView: '',
} as const;
