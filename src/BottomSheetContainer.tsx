import React from 'react'
import loadable, { LoadableClassComponent, LoadableComponent } from '@loadable/component'
import { useRecoilValue } from 'recoil'
import { nanoid } from '../../lib/utils/nanoid'
import { bottomSheet } from '../../lib/recoil/atoms/BottomSheet'
import { BottomSheet } from '../../lib/types/BottomSheet'

interface bottomSheetFilter {
  [type: string]: LoadableClassComponent<any>
  testBottomSheet: LoadableClassComponent<any>
}

type Props = {
  type: string
  props?: Object
}

const BOTTOM_SHEET_COMPONENTS: bottomSheetFilter = {
  testBottomSheet: loadable(() => import('./TestBottomSheet')),
}

function BottomSheetContainer() {
  const bottomSheetList = useRecoilValue(bottomSheet)
  const renderBottomSheet = bottomSheetList.map(({ type, props }: Props) => {
    const BottomSheetComponent: LoadableClassComponent<any> = BOTTOM_SHEET_COMPONENTS[type]
    return <BottomSheetComponent key={nanoid()} id={type} {...props} />
  })

  // if (renderModal.length !== 0) document.body.style.overflow = 'hidden'
  // else document.body.style.removeProperty('overflow')

  // console.log(renderModal)
  // console.log(renderBottomSheet)
  return <>{renderBottomSheet}</>
}

export default BottomSheetContainer
