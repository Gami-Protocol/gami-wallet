import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { type AccentColor, ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  color?: AccentColor;
  textColor?: string;
  disabled?: boolean;
  /** Optional leading element (icon). */
  leading?: ReactNode;
  /** Optional trailing element. */
  trailing?: ReactNode;
  offset?: number;
};

/**
 * The signature GAMI sticker button. Light haptic on press, presses "into"
 * its shadow for tactile feel.
 */
export function PrimaryButton({
  label,
  onPress,
  color = 'purple',
  textColor = COLORS.white,
  disabled = false,
  leading,
  trailing,
  offset = 6,
}: PrimaryButtonProps) {
  const shift = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }, { translateY: shift.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    shift.value = withTiming(offset, { duration: 60 });
  };
  const handlePressOut = () => {
    shift.value = withTiming(0, { duration: 80 });
  };
  const handlePress = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: offset,
            top: offset,
            right: -offset,
            bottom: -offset,
            backgroundColor: COLORS.black,
          }}
        />
        <Animated.View
          style={[
            {
              backgroundColor: ACCENT_HEX[color],
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            },
            faceStyle,
          ]}
        >
          {leading}
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 16,
              letterSpacing: 0.5,
              color: textColor,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          {trailing}
        </Animated.View>
      </View>
    </Pressable>
  );
}
