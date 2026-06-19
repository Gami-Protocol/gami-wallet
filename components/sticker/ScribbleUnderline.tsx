import Svg, { Path } from 'react-native-svg';

import { COLORS } from '@/lib/theme';

type ScribbleUnderlineProps = {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Hand-drawn scribble underline that sits beneath hero headline words.
 */
export function ScribbleUnderline({
  width = 160,
  height = 14,
  color = COLORS.magenta,
  strokeWidth = 3,
}: ScribbleUnderlineProps) {
  // A wobbly path normalized to a 200x16 viewBox, scaled to the requested size.
  return (
    <Svg width={width} height={height} viewBox="0 0 200 16" fill="none">
      <Path
        d="M3 11C29 5 54 4 78 7C95 9 70 13 88 13C120 13 150 4 197 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
