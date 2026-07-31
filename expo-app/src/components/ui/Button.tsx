import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, radius, typography } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}) => {
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    // Fast spring — tension 420, friction 15 → physical, snappy
    pressed.value = withSpring(1, { stiffness: 420, damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { stiffness: 420, damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }],
    opacity: interpolate(pressed.value, [0, 1], [1, disabled ? 1 : 0.88]),
  }));

  const getContainerStyles = (): ViewStyle => {
    if (disabled) {
      return { backgroundColor: colors.neutral100, borderColor: colors.neutral100, borderWidth: 1 };
    }
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.neutral50, borderColor: colors.neutral200, borderWidth: 1 };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.blue400, borderWidth: 1 };
      default:
        return { backgroundColor: colors.blue400 };
    }
  };

  const getTextStyles = (): TextStyle => {
    if (disabled) return { color: colors.neutral400 };
    switch (variant) {
      case 'secondary':
        return { color: colors.neutral600 };
      case 'outline':
        return { color: colors.blue400 };
      default:
        return { color: colors.white };
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      style={[styles.container, getContainerStyles(), animatedStyle, style]}
    >
      <Text style={[styles.text, getTextStyles()]}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.1,
  },
});
