import { View } from 'react-native';

import { COLORS } from '@/lib/theme';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display } from '@/components/sticker';

/** 09 First quest — placeholder; built in a later phase. */
export default function FirstQuest() {
  return (
    <OnboardingScreen step={3} showBack>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <Display style={{ fontSize: 30, color: COLORS.white }}>First Steps.</Display>
        <Body style={{ color: COLORS.muted }}>Coming in the next build phase.</Body>
      </View>
    </OnboardingScreen>
  );
}
