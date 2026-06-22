import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/lib/theme';
import { authenticate } from '@/lib/wallet/auth';
import { Body, Display, NovaAvatar, PrimaryButton, RadialBloom } from '@/components/sticker';

/**
 * Full-screen lock overlay shown when auto-lock triggers. Requires a fresh
 * biometric / device-passcode unlock before the app is accessible again.
 */
export function LockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const [busy, setBusy] = useState(false);

  const tryUnlock = useCallback(async () => {
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await authenticate('Unlock GAMI');
    setBusy(false);
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    }
  }, [onUnlock]);

  // Prompt immediately on mount.
  useEffect(() => {
    void tryUnlock();
  }, [tryUnlock]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      <RadialBloom>
        <View className="flex-1 items-center justify-center px-8" style={{ gap: 22 }}>
          <NovaAvatar size={96} animated />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Display style={{ fontSize: 24, color: COLORS.white, letterSpacing: 1 }}>
              LOCKED
            </Display>
            <Body style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>
              Your wallet locked after inactivity. Unlock to continue.
            </Body>
          </View>
          <View style={{ width: '100%', maxWidth: 280 }}>
            <PrimaryButton
              label={busy ? 'Unlocking…' : 'Unlock'}
              color="lime"
              textColor={COLORS.black}
              disabled={busy}
              onPress={() => void tryUnlock()}
            />
          </View>
        </View>
      </RadialBloom>
    </View>
  );
}
