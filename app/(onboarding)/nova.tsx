import { View } from 'react-native';

import { COLORS } from '@/lib/theme';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display } from '@/components/sticker';

/** 07 NOVA intro — placeholder; built in a later phase. */
export default function Nova() {
  return (
    <OnboardingScreen step={2} showBack>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <Display style={{ fontSize: 30, color: COLORS.white }}>meet NOVA.</Display>
        <Body style={{ color: COLORS.muted }}>Coming in the next build phase.</Body>
      </View>
    </OnboardingScreen>
  );
}
