import { type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { COLORS } from '@/lib/theme';
import { cn } from '@/lib/utils';

type StickerCardProps = {
  children?: ReactNode;
  /** Hex fill for the card body. Defaults to the dark card color. */
  fill?: string;
  /** Offset of the hard black shadow in px. Defaults to 6. */
  offset?: number;
  /** Color of the hard shadow. Defaults to black. */
  shadowColor?: string;
  /** Border color. Defaults to black. */
  borderColor?: string;
  borderWidth?: number;
  rotate?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The signature GAMI sticker surface: a flat fill with a 2px border and a hard
 * (no-blur) offset shadow rendered as a sibling block behind the card.
 */
export function StickerCard({
  children,
  fill = COLORS.card,
  offset = 6,
  shadowColor = COLORS.black,
  borderColor = COLORS.black,
  borderWidth = 2,
  rotate = 0,
  className,
  style,
}: StickerCardProps) {
  return (
    <View style={[{ transform: [{ rotate: `${rotate}deg` }] }, style]}>
      {/* Hard offset shadow */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: offset,
          top: offset,
          right: -offset,
          bottom: -offset,
          backgroundColor: shadowColor,
        }}
      />
      <View
        className={cn('p-4', className)}
        style={{ backgroundColor: fill, borderWidth, borderColor }}
      >
        {children}
      </View>
    </View>
  );
}
