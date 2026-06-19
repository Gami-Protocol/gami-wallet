import { Text, View } from 'react-native';

import { type AccentColor, ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';

export type CharacterId = 'NX' | 'PX' | 'ZK' | 'OG' | 'OX' | 'GG';

export const CHARACTERS: { id: CharacterId; color: AccentColor }[] = [
  { id: 'NX', color: 'purple' },
  { id: 'PX', color: 'magenta' },
  { id: 'ZK', color: 'cyan' },
  { id: 'OG', color: 'lime' },
  { id: 'OX', color: 'yellow' },
  { id: 'GG', color: 'magenta' },
];

export const CHARACTER_COLOR: Record<CharacterId, AccentColor> = {
  NX: 'purple',
  PX: 'magenta',
  ZK: 'cyan',
  OG: 'lime',
  OX: 'yellow',
  GG: 'magenta',
};

type CharacterTileProps = {
  id: CharacterId;
  size?: number;
  selected?: boolean;
  color?: AccentColor;
};

/**
 * A square character tile showing a 2-letter handle in a bold display font.
 */
export function CharacterTile({ id, size = 56, selected = false, color }: CharacterTileProps) {
  const accent = color ?? CHARACTER_COLOR[id];
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: ACCENT_HEX[accent],
        borderWidth: selected ? 3 : 2,
        borderColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.display,
          fontSize: size * 0.42,
          color: COLORS.black,
        }}
      >
        {id}
      </Text>
    </View>
  );
}
