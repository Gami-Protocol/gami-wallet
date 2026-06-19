/**
 * GAMI WALLET palette — single source of truth for colors used OUTSIDE className
 * (icons, native props, SVG strokes, gradients). Inside className use the
 * Tailwind tokens (bg-purple, text-magenta, etc.) defined in global.css.
 */
export const COLORS = {
  ink: '#08060F',
  inkSoft: '#11091F',
  card: '#160C2B',
  purple: '#6E3CFB',
  magenta: '#FF3D9A',
  lime: '#A6FF3D',
  yellow: '#FFD53D',
  cyan: '#3DE6FF',
  paper: '#F4F0FF',
  white: '#FFFFFF',
  black: '#000000',
  muted: '#A79CC9',
} as const;

export type AccentColor = 'purple' | 'magenta' | 'lime' | 'yellow' | 'cyan';

export const ACCENT_HEX: Record<AccentColor, string> = {
  purple: COLORS.purple,
  magenta: COLORS.magenta,
  lime: COLORS.lime,
  yellow: COLORS.yellow,
  cyan: COLORS.cyan,
};

export const FONTS = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;
