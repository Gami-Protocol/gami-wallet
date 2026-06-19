import { View } from 'react-native';
import { router } from 'expo-router';

import { COLORS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, PrimaryButton } from '@/components/sticker';

/** 06 Handle — placeholder; built in a later phase. */
export default function Handle() {
  return (
    <OnboardingScreen step={2} showBack>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
        <Display style={{ fontSize: 30, color: COLORS.white }}>Pick your character.</Display>
        <Body style={{ color: COLORS.muted }}>Coming in the next build phase.</Body>
        <PrimaryButton label="Continue" onPress={() => router.replace(ROUTES.home)} />
      </View>
    </OnboardingScreen>
  );
}
