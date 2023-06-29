import { useSetRecoilState } from 'recoil'
import { bottomSheet } from '../recoil/atoms/BottomSheet'
import { BottomSheet } from '../types/BottomSheet'

function useBottomSheet() {
  const setBottomSheetList = useSetRecoilState<BottomSheet[]>(bottomSheet)

  const handleOpenBottomSheet = (newBottomSheet: BottomSheet) => {
    setBottomSheetList(p => [...p, newBottomSheet])
  }

  const handleCloseBottomSheet = () => {
    setBottomSheetList(p => [...p.slice(0, -1)])
  }

  return { openBottomSheet: handleOpenBottomSheet, closeBottomSheet: handleCloseBottomSheet }
}

export default useBottomSheet
