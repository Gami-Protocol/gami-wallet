import { View } from 'react-native';
import { router } from 'expo-router';

import { COLORS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, PrimaryButton } from '@/components/sticker';

/** 11 Permissions — placeholder; built in a later phase. */
export default function Permissions() {
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const finish = () => {
    completeOnboarding();
    router.replace(ROUTES.home);
  };
  return (
    <OnboardingScreen step={3} showBack>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
        <Display style={{ fontSize: 30, color: COLORS.white }}>Stay in the loop.</Display>
        <Body style={{ color: COLORS.muted }}>Coming in the next build phase.</Body>
        <PrimaryButton label="Enter GAMI" onPress={finish} />
      </View>
    </OnboardingScreen>
  );
}
