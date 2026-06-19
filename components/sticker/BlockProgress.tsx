import { View } from 'react-native';

import { COLORS } from '@/lib/theme';

type BlockProgressProps = {
  /** Progress 0..1. */
  progress: number;
  /** Number of blocks. */
  blocks?: number;
  fill?: string;
  height?: number;
};

/**
 * Chunky segmented block progress bar (splash / XP bars).
 */
export function BlockProgress({
  progress,
  blocks = 10,
  fill = COLORS.purple,
  height = 14,
}: BlockProgressProps) {
  const filledCount = Math.round(Math.min(Math.max(progress, 0), 1) * blocks);
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 3,
        padding: 3,
        borderWidth: 2,
        borderColor: COLORS.black,
        backgroundColor: COLORS.inkSoft,
      }}
    >
      {Array.from({ length: blocks }, (_, i) => `blk-${i}`).map((id, i) => (
        <View
          key={id}
          style={{ flex: 1, height, backgroundColor: i < filledCount ? fill : COLORS.card }}
        />
      ))}
    </View>
  );
}
