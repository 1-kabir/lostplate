import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  /** Vertical offset to start from (default: 10). Keep small — this is subtle. */
  slideOffset?: number;
  /** Fade duration in ms (default: 220) */
  duration?: number;
}

/**
 * Wraps a screen (or any subtree) in a clean entrance animation:
 * a short upward drift (10px) combined with a fade-in.
 *
 * Usage — just wrap your screen's top-level view:
 *   <ScreenTransition>
 *     <SafeAreaView>...</SafeAreaView>
 *   </ScreenTransition>
 */
export function ScreenTransition({
  children,
  slideOffset = 10,
  duration = 220,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(slideOffset);

  useEffect(() => {
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: duration + 20, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fill, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
