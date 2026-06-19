import { View } from 'react-native';

import { COLORS } from '@/lib/theme';

type DotsGridProps = {
  /** Total segments. Onboarding uses 4. */
  total?: number;
  /** Zero-based index of the current segment. */
  current: number;
};

/**
 * 4-segment progress dots row shown at the top of onboarding screens.
 * Active/completed segments are wide bars; pending are small squares.
 */
export function DotsGrid({ total = 4, current }: DotsGridProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => `seg-${i}`).map((id, i) => {
        const done = i <= current;
        return (
          <View
            key={id}
            style={{
              height: 6,
              width: done ? 28 : 10,
              backgroundColor: done ? COLORS.purple : COLORS.card,
              borderWidth: 2,
              borderColor: COLORS.black,
            }}
          />
        );
      })}
    </View>
  );
}
