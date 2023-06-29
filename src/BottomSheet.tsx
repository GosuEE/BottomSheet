import React, {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Pressable,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import tw from "./styles/tailwind";
import Animated, {
  Easing,
  Keyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  GestureEvent,
  PanGestureHandlerEventPayload,
  HandlerStateChangeEvent,
  GestureDetector,
} from "react-native-gesture-handler";
import useBottomSheet from "./lib/hooks/useBottomSheet";
import { AnyFunction } from "./lib/types/AnyFunction";

interface BottomSheetRef {
  expand: () => null;
}

type Props = {
  /**
   * BottomSheet의 내부에 들어갈 component입니다.
   */
  children: React.ReactNode;
  /**
   * BottomSheet의 Top Bar를 제외한 높이입니다.
   */
  height: number;
  /**
   * BottomSheet을 고정시킬 높이입니다.
   * 기본값은 BottomSheet의 height입니다.
   */
  breakPoints?: number[];
  /**
   * BottomSheet을 터치하여 위 아래로 이동할 때 모션을 적용시킬 시간입니다.
   * 단위는 ms이고 기본값은 16입니다.
   */
  onPanGestureDuration?: number;
  /**
   * 스크린에서 손가락이 떨어졌을 떄 BottomSheet의 높이를 break point로 조정합니다.
   * 그 때 모션을 적용시킬 시간입니다. 기본값은 300입니다.
   */
  changeScaleDuration?: number;
  /**
   * 처음 BottomSheet이 Expand될 때 모션을 적용시킬 시간입니다. 기본값은 300입니다.
   */
  firstExtendingDuration?: number;
  /**
   * BottomSheet의 Body에 적용시킬 style입니다.
   * 근데 그냥 children 컴포넌트에서 해결하는게 더 나을 것 같습니다.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * BottomSheet 상단바 핸들의 색상입니다. 기본값은 #B7B7B7(회색)입니다.
   */
  handleColor?: string;
  /**
   * BottomSheet 핸들의 길이입니다. 기본값은 25%입니다.
   */
  handleWidth?: string;
  /**
   * BottomSheet 핸들의 높이입니다. 기본 값은 5px입니다.
   */
  handleHeight?: string;
  /**
   * BottomSheet TopBar의 높이입니다. 기본값은 30이고, 픽셀단위로만 지정이 가능합니다.
   * 만일 TopBar의 높이가 20보다 작아지면, border radius가 잘 적용되지 않습니다. 유의하세요!
   */
  topBarHeight?: number;
  /**
   * 오버레이를 보이게 / 안보이게 하는 옵션입니다. 기본값은 false입니다.
   * showOverlay가 true면 touchBackGround는 값에 상관 없이 false처럼 작동합니다.
   */
  showOverlay?: boolean;
  /**
   * Overlay를 터치하여 BottomSheet을 닫을지, 닫지 않을지를 설정합니다. 기본값은 false입니다.
   */
  closeBottomSheetOnTouchOverlay?: boolean;
  /**
   * BottomSheet의 BackGround를 터치할 수 있게 / 터치 못하게 설정합니다. 기본값은 true입니다.
   * showOverlay가 true면 touchBackGround는 값에 상관 없이 false처럼 작동합니다.
   */
  touchBackGround?: boolean;
  /**
   * easing에 적용될 cubic bezier function입니다.
   */
  bezierFunction?: Animated.EasingFunction;
  /**
   * true면 BottomSheet의 높이를 고정시킵니다.
   * 기본값은 false입니다.
   */
  fixBottomSheetScale?: boolean;
  /**
   * true면 height이 변경될 때 BottomSheet이 height만큼 expand됩니다.
   * 기본값은 true입니다.
   */
  expandBottomSheetOnHeightChange?: boolean;
  /**
   * BottomSheet의 Top 좌표가 바뀔 때 마다 호출되는 함수입니다.
   * 보통 쓸일이 없는데, 가끔 아주 유용하게 쓰입니다.
   */
  sideEffectOnTopChange?: (top: number) => any;
  /**
   * Animation의 duration이 바뀔 때 마다 호출되는 함수입니다.
   * 얘도 보통 쓸 일이 없는데 가끔 아주 유용하게 쓰입니다.
   */
  setAnimationDuration?: (duration: number) => any;
};

const BottomSheet = (
  {
    children,
    height,
    breakPoints = [],
    onPanGestureDuration = 16,
    changeScaleDuration = 300,
    firstExtendingDuration = 300,
    handleColor = "#B7B7B7",
    handleWidth = "25%",
    handleHeight = "5px",
    topBarHeight = 30,
    style,
    showOverlay = false,
    closeBottomSheetOnTouchOverlay = false,
    touchBackGround = true,
    bezierFunction = Easing.bezierFn(0.42, 0.0, 0.58, 1.0),
    fixBottomSheetScale = false,
    expandBottomSheetOnHeightChange = true,
    sideEffectOnTopChange,
    setAnimationDuration,
  }: Props,
  ref?: any
) => {
  const windowHeight = useMemo(() => Dimensions.get("window").height, []);
  const [onBeganY, setOnBeganY] = useState<number>(-1);
  const [duration, setDuration] = useState<number>(firstExtendingDuration);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [sortedBreakPoints, setSortedBreakPoints] = useState<number[]>([]);
  const [overlayZIndex, setOverlayZIndex] = useState<-1000 | 1001>(
    touchBackGround && !showOverlay ? -1000 : 1001
  );

  const [exit, setExit] = useState<boolean>(false);
  // const [overlayOpacity, setOverlayOpacity] = useState(showOverlay ? 0.2 : 0)
  const top = useSharedValue(windowHeight);
  const opacity = useSharedValue(showOverlay ? 0.2 : 0);
  const bodyHeight = useSharedValue(0);
  const expandFlag = useRef<boolean>(false);

  const afterCloseCallback = useRef<AnyFunction | undefined>();

  const close = useCallback(() => {
    setDuration(firstExtendingDuration);
    setAnimationDuration && setAnimationDuration(firstExtendingDuration);
    setExit(true);
  }, []);

  const onEnter = useCallback(() => {
    setDuration(onPanGestureDuration);
    setAnimationDuration && setAnimationDuration(onPanGestureDuration);
    setEnabled(true);
    expandFlag.current = false;
  }, []);

  const { closeBottomSheet } = useBottomSheet();

  const Overlay = useMemo(() => {
    return Animated.createAnimatedComponent(Pressable);
  }, []);
  const Wrapper = useMemo(() => {
    return Animated.createAnimatedComponent(View);
  }, []);
  const Body = useMemo(() => {
    return Animated.createAnimatedComponent(View);
  }, []);

  const bodyAnim = useAnimatedStyle(() => {
    return {
      height: withTiming(bodyHeight.value, {
        duration: duration,
        easing: bezierFunction,
      }),
    };
  });

  const topAnim = useAnimatedStyle(() => {
    return {
      top: withTiming(
        top.value,
        {
          duration: duration,
          easing: bezierFunction,
        },
        (finished) => {
          "worklet";
          if (exit && finished) {
            runOnJS(closeBottomSheet)();
          }
          if (finished)
            runOnJS(() => {
              expandFlag.current = false;
            });
        }
      ),
    };
  });

  const overlayExitAnim = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: firstExtendingDuration,
        easing: bezierFunction,
      }),
    };
  });

  const overlayFadeAnim = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        opacity.value,
        {
          duration: firstExtendingDuration,
          easing: bezierFunction,
        },
        (finished) => {
          "worklet";
          if (finished)
            runOnJS(setOverlayZIndex)(
              touchBackGround && !showOverlay ? -1000 : 1001
            );
        }
      ),
    };
  });

  /**
   * 현재의 위치를 해당하는 break point로 이동시킵니다.
   */
  const calculateBreakPointPosition = () => {
    setOnBeganY(-1);

    if (expandFlag.current) {
      expandFlag.current = false;
      return;
    }

    const length = sortedBreakPoints.length;
    const bottomY = windowHeight;
    const bottomUpperBound = sortedBreakPoints[1] / 2;
    if (top.value > bottomY - bottomUpperBound - topBarHeight) {
      bodyHeight.value = 0;
      setAnimationDuration && setAnimationDuration(changeScaleDuration);
      sideEffectOnTopChange && sideEffectOnTopChange(0);
      close();
      return;
    }

    // 모든 breakPoints에 대해 검사
    for (var i = 1; i < length - 1; i++) {
      const baseY = windowHeight - sortedBreakPoints[i];
      const lowerBound = (sortedBreakPoints[i] - sortedBreakPoints[i - 1]) / 2;
      const upperBound = (sortedBreakPoints[i + 1] - sortedBreakPoints[i]) / 2;

      if (
        top.value <= baseY + lowerBound - topBarHeight &&
        top.value > baseY - upperBound - topBarHeight
      ) {
        top.value = baseY - topBarHeight;
        bodyHeight.value = windowHeight - baseY;
        setAnimationDuration && setAnimationDuration(changeScaleDuration);
        sideEffectOnTopChange && sideEffectOnTopChange(baseY - topBarHeight);
        setDuration(changeScaleDuration);
        return;
      }
    }

    // 마지막 breakPoint는 height
    const topY = windowHeight - sortedBreakPoints[length - 1];
    const topLowerBound =
      (sortedBreakPoints[length - 1] - sortedBreakPoints[length - 2]) / 2;
    if (top.value <= topY + topLowerBound) {
      top.value = windowHeight - sortedBreakPoints[length - 1] - topBarHeight;
      bodyHeight.value = sortedBreakPoints[length - 1];
      setAnimationDuration && setAnimationDuration(changeScaleDuration);
      sideEffectOnTopChange &&
        sideEffectOnTopChange(
          windowHeight - sortedBreakPoints[length - 1] - topBarHeight
        );
      setDuration(changeScaleDuration);
    }
  };

  // pan gesture가 진행중..
  const handlePanGestuer = (
    event: GestureEvent<PanGestureHandlerEventPayload>
  ) => {
    if (onBeganY !== -1) {
      if (windowHeight - height > event.nativeEvent.absoluteY) {
        setOnBeganY(0);
        return;
      }
      const newTop = event.nativeEvent.absoluteY - onBeganY;
      if (newTop >= windowHeight - height) {
        top.value = newTop - topBarHeight;
        sideEffectOnTopChange && sideEffectOnTopChange(newTop - topBarHeight);
        bodyHeight.value = windowHeight - newTop;
        // console.log(bodyHeight.value)
      }
    }

    // TODO: Bottom Sheet을 종료 / 혹은 가장 크게 extend할 적절한 속도 구하기
    // console.log(event.nativeEvent.velocityY)
    // if (event.nativeEvent.velocityY < -2000) {
    //   setDuration(changeScaleDuration)
    //   setEnabled(false)
    //   setTimeout(() => {
    //     setEnabled(true)
    //   }, changeScaleDuration)
    //   top.value = windowHeight - height
    // }
    // if (event.nativeEvent.velocityY > 3000) {
    //   top.value = windowHeight
    //   setEnabled(false)
    //   close()
    // }
  };

  // pan gesture가 시작됐을 때.
  const handleActived = (
    event: HandlerStateChangeEvent<Record<string, unknown>>
  ) => {
    setDuration(onPanGestureDuration);
    setAnimationDuration && setAnimationDuration(onPanGestureDuration);
    setOnBeganY(Number(event.nativeEvent.y) - topBarHeight);
  };

  // 스크린에서 손가락이 떨어졌을 때.
  const handleEnded = (
    event: HandlerStateChangeEvent<Record<string, unknown>>
  ) => {
    calculateBreakPointPosition();
  };

  useEffect(() => {
    top.value = windowHeight - height - topBarHeight;
    sideEffectOnTopChange &&
      sideEffectOnTopChange(windowHeight - height - topBarHeight);
    bodyHeight.value = height;
  }, []);

  useEffect(() => {
    for (var i = 0; i < breakPoints.length; i++) {
      if (breakPoints[i] <= 0)
        throw new Error("break points must be bigger than 0");
      else if (breakPoints[i] >= height)
        throw new Error("break points must be smaller than height");
    }
    let tempBreakPoints = [...breakPoints];
    tempBreakPoints.sort((a, b) => a - b);
    tempBreakPoints = [0, ...tempBreakPoints, height];
    if (JSON.stringify(sortedBreakPoints) !== JSON.stringify(tempBreakPoints))
      setSortedBreakPoints([...tempBreakPoints]);
  }, [breakPoints]);

  useEffect(() => {
    if (expandBottomSheetOnHeightChange) {
      setDuration(changeScaleDuration);
      setAnimationDuration && setAnimationDuration(changeScaleDuration);
      top.value = windowHeight - height - topBarHeight;
      sideEffectOnTopChange &&
        sideEffectOnTopChange(windowHeight - height - topBarHeight);
      bodyHeight.value = height;
      expandFlag.current = true;
    }
    if (sortedBreakPoints.length !== 0) {
      setSortedBreakPoints((current) => {
        current[current.length - 1] = height;
        return current;
      });
    }
  }, [height]);

  useEffect(() => {
    if (enabled) {
      calculateBreakPointPosition();
    }
  }, [sortedBreakPoints]);

  useEffect(() => {
    opacity.value = showOverlay ? 0.2 : 0;
  }, [showOverlay]);

  useEffect(() => {
    if (exit && duration === firstExtendingDuration) {
      top.value = windowHeight;
      sideEffectOnTopChange && sideEffectOnTopChange(windowHeight);
      opacity.value = 0;
    }
  }, [exit, duration]);
  useImperativeHandle(ref, () => ({
    expand() {
      top.value = windowHeight - height - topBarHeight;
      sideEffectOnTopChange &&
        sideEffectOnTopChange(windowHeight - height - topBarHeight);
      bodyHeight.value = height;
    },
    getTop() {
      return top.value;
    },
    close(callBack: AnyFunction) {
      afterCloseCallback.current = callBack;
      setDuration(firstExtendingDuration);
      setAnimationDuration && setAnimationDuration(firstExtendingDuration);
      setExit(true);
    },
  }));

  useEffect(() => {
    return () => {
      afterCloseCallback.current && afterCloseCallback.current();
    };
  }, []);

  return (
    <Fragment>
      {(!touchBackGround || showOverlay) && (
        <Overlay
          entering={new Keyframe({
            0: {
              opacity: 0,
            },
            100: {
              opacity: showOverlay ? 0.2 : 0,
              easing: Easing.bezierFn(0.0, 0.0, 0.58, 1.0),
            },
          }).duration(firstExtendingDuration)}
          style={[
            exit ? overlayExitAnim : overlayFadeAnim,
            tw`flex flex-1 justify-end absolute w-[${
              Dimensions.get("window").width
            }px] h-[${
              Dimensions.get("window").height
            }px] top-0 left-0 text-center bg-[rgb(0,0,0)]`,
            {
              zIndex: overlayZIndex,
              elevation: Platform.OS === "android" ? overlayZIndex : 0,
            },
          ]}
          onPress={enabled && closeBottomSheetOnTouchOverlay ? close : () => {}}
        />
      )}
      <PanGestureHandler
        enabled={enabled && !fixBottomSheetScale && !exit}
        onEnded={handleEnded}
        onActivated={handleActived}
        onGestureEvent={handlePanGestuer}
      >
        <Wrapper
          entering={new Keyframe({ 0: {}, 100: {} })
            .duration(firstExtendingDuration)
            .withCallback((finished) => {
              "worklet";
              if (finished) runOnJS(onEnter)();
            })}
          style={[
            topAnim,
            style,
            tw`w-full z-1002 rounded-t-[20px]`,
            { position: "absolute", top: windowHeight },
          ]}
        >
          <View
            style={tw`w-full h-[${topBarHeight}px] bg-white rounded-t-[20px]`}
          >
            <View
              style={tw`m-auto rounded-full bg-[${handleColor}] bg-${handleColor} w-[${handleWidth}] w-${handleWidth} h-[${handleHeight}] h-${handleHeight}`}
            />
          </View>
          <Body style={[bodyAnim, tw`bg-white`]}>{children}</Body>
        </Wrapper>
      </PanGestureHandler>
    </Fragment>
  );
};

export default React.forwardRef(BottomSheet);
