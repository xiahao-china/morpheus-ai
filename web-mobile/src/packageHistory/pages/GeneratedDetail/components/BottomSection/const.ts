import { IGeneratedDetails, getModeLabel, getRatioDisplay } from '../../const'

export interface IBottomSectionProps {
  details: IGeneratedDetails
}

export const computeModeLabel = (mode?: string) => getModeLabel(mode)
export const computeRatioDisplay = (info: Pick<IGeneratedDetails, 'ratio' | 'width' | 'height'>) => getRatioDisplay(info)
