import { type ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { COLORS } from '@/lib/theme';
import { DotsGrid, RadialBloom } from '@/components/sticker';

type OnboardingScreenProps = {
  children: ReactNode;
  /** Zero-based segment for the 4-dot progress row, or null to hide. */
  step?: number | null;
  showBack?: boolean;
};

/**
 * Shared onboarding scaffold: bloom backdrop, safe-area padding, top row with
 * optional back button + 4-segment progress dots.
 */
export function OnboardingScreen({
  children,
  step = null,
  showBack = false,
}: OnboardingScreenProps) {
  return (
    <RadialBloom>
      <View className="pt-safe-offset-4 pb-safe-offset-4 flex-1 px-5">
        {(step !== null || showBack) && (
          <View className="mb-6 h-9 flex-row items-center justify-between">
            {showBack ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  width: 34,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.card,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                }}
              >
                <ChevronLeft color={COLORS.white} size={20} />
              </Pressable>
            ) : (
              <View style={{ width: 34 }} />
            )}
            {step !== null && <DotsGrid current={step} />}
            <View style={{ width: 34 }} />
          </View>
        )}
        {children}
      </View>
    </RadialBloom>
  );
}
