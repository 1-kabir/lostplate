import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useToastStore } from '../../store/toastStore';
import { colors, typography, radius, shadows } from '../../constants/theme';
import { CheckCircle, Warning, Info, X } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

export const Toast: React.FC = () => {
  const { visible, message, type, hideToast } = useToastStore();
  
  // Snappy layout inputs: slide up 32px and fade in
  const translateY = useSharedValue(32);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(32, { duration: 200, easing: Easing.in(Easing.quad) });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          textColor: colors.green,
          indicatorColor: colors.green,
          Icon: CheckCircle,
        };
      case 'error':
        return {
          textColor: colors.red,
          indicatorColor: colors.red,
          Icon: Warning,
        };
      default:
        return {
          textColor: colors.blue500,
          indicatorColor: colors.blue400,
          Icon: Info,
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.Icon;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Urgency-style left color indicator bar matching guidelines */}
      <View style={[styles.indicatorBar, { backgroundColor: config.indicatorColor }]} />
      
      <View style={styles.inner}>
        <Icon color={config.indicatorColor} size={20} weight="bold" />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
        <Pressable onPress={hideToast} style={styles.closeBtn}>
          <X color={colors.neutral400} size={16} weight="bold" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: colors.neutral50, // Matches cards
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.float, // Floating shadow since it sits on top of content
  },
  indicatorBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: {
    flex: 1,
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.neutral900,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginRight: -4,
  },
});
