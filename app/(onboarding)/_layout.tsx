import { Stack } from 'expo-router';

import { COLORS } from '@/lib/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.ink },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="create-wallet" options={{ gestureEnabled: false }} />
      <Stack.Screen name="vault" />
      <Stack.Screen name="handle" />
      <Stack.Screen name="nova" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="first-quest" />
      <Stack.Screen name="starter-pack" options={{ animation: 'fade' }} />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
