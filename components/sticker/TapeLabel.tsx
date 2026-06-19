import { Text, View } from 'react-native';

import { type AccentColor, ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';

type TapeLabelProps = {
  label: string;
  color?: AccentColor;
  /** Rotation in degrees. Spec: 2-4°. */
  rotate?: number;
  textColor?: string;
};

/**
 * Decorative "tape" callout — a small rotated rectangle with mono uppercase text.
 */
export function TapeLabel({
  label,
  color = 'magenta',
  rotate = -3,
  textColor = COLORS.black,
}: TapeLabelProps) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: ACCENT_HEX[color],
        paddingHorizontal: 8,
        paddingVertical: 3,
        transform: [{ rotate: `${rotate}deg` }],
        borderWidth: 2,
        borderColor: COLORS.black,
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.monoBold,
          fontSize: 10,
          letterSpacing: 1,
          color: textColor,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
