import { atom } from 'recoil'
import { BottomSheet } from '../../types/BottomSheet'

export const bottomSheet = atom<BottomSheet[]>({
  key: 'bottomSheet',
  default: [],
})
