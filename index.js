/**
 * @format
 */

import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { RecoilRoot } from 'recoil'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import tw from './src/styles/tailwind'
import BottomSheetContainer from './src/components/BottomSheet/BottomSheetContainer'

const Wrapper = () => {
  return (
    <RecoilRoot>
      <GestureHandlerRootView style={tw`flex-1`}>
        <BottomSheetContainer />
        <App />
      </GestureHandlerRootView>
    </RecoilRoot>
  )
}

AppRegistry.registerComponent(appName, () => Wrapper)
