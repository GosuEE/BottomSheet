import React, { useEffect } from "react";
import tw from "./src/styles/tailwind";
import { Text, View } from "react-native";
import useBottomSheet from "./src/lib/hooks/useBottomSheet";
import BottomSheetContainer from "./src/BottomSheetContainer";

const App = () => {
  const { openBottomSheet } = useBottomSheet();
  useEffect(() => {
    openBottomSheet({ type: "testBottomSheet", props: {} });
  }, []);
  return <View style={tw`w-full h-full`}></View>;
};

export default App;
