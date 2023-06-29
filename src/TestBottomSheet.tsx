import React from "react";
import BottomSheet from "./BottomSheet";
import tw from "./styles/tailwind";
import { Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const TestBottomSheet = () => {
  return (
    <BottomSheet style={tw``} height={300}>
      <View style={tw`w-full h-full`}></View>
    </BottomSheet>
  );
};

export default TestBottomSheet;
