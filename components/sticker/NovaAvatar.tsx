import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { COLORS } from '@/lib/theme';

type NovaAvatarProps = {
  size?: number;
  /** Render the soft glow halo behind the orb. */
  glow?: boolean;
  /** Animate a gentle floating bob + antenna pulse. */
  animated?: boolean;
};

/**
 * NOVA — the purple mascot orb with a smile, antenna, and soft glow.
 */
export function NovaAvatar({ size = 120, glow = true, animated = true }: NovaAvatarProps) {
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    bob.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [animated, bob]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -6 }],
  }));

  const orb = size;
  return (
    <View style={{ width: orb, height: orb + 18, alignItems: 'center', justifyContent: 'center' }}>
      {glow && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: orb * 1.5,
            height: orb * 1.5,
            borderRadius: orb,
            backgroundColor: COLORS.purple,
            opacity: 0.28,
          }}
        />
      )}
      <Animated.View style={floatStyle}>
        <Svg width={orb} height={orb + 18} viewBox="0 0 120 138">
          {/* Antenna */}
          <Line x1="60" y1="20" x2="60" y2="4" stroke={COLORS.black} strokeWidth={3} />
          <Circle cx="60" cy="6" r="6" fill={COLORS.cyan} stroke={COLORS.black} strokeWidth={2} />
          {/* Orb body */}
          <Circle
            cx="60"
            cy="78"
            r="50"
            fill={COLORS.purple}
            stroke={COLORS.black}
            strokeWidth={3}
          />
          {/* Highlight */}
          <Circle cx="42" cy="60" r="12" fill={COLORS.white} opacity={0.25} />
          {/* Eyes */}
          <Circle cx="44" cy="70" r="6" fill={COLORS.black} />
          <Circle cx="76" cy="70" r="6" fill={COLORS.black} />
          {/* Smile */}
          <Path
            d="M40 92 Q60 112 80 92"
            stroke={COLORS.black}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
