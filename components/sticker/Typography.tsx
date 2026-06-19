import { Text as RNText, type TextProps } from 'react-native';

import { COLORS, FONTS } from '@/lib/theme';

type BaseProps = TextProps & { color?: string };

/** Space Grotesk display text (headings, button-ish labels). */
export function Display({ style, color = COLORS.white, ...rest }: BaseProps) {
  return <RNText {...rest} style={[{ fontFamily: FONTS.display, color }, style]} />;
}

/** JetBrains Mono — for ALL numbers, addresses, hashes, timestamps. */
export function Mono({ style, color = COLORS.white, ...rest }: BaseProps) {
  return <RNText {...rest} style={[{ fontFamily: FONTS.mono, color }, style]} />;
}

/** Inter body text. */
export function Body({ style, color = COLORS.paper, ...rest }: BaseProps) {
  return <RNText {...rest} style={[{ fontFamily: FONTS.body, color }, style]} />;
}
