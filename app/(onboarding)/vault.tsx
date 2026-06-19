import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Delete, ScanFace } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { authenticate, setVaultMode } from '@/lib/wallet/auth';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, Mono, PrimaryButton, StickerCard, TapeLabel } from '@/components/sticker';

type Stage = 'choose' | 'pin';

function proceed() {
  router.replace(ROUTES.handle);
}

/**
 * 05 Secure vault — Face ID / 6-digit PIN / Skip (with warning tape).
 */
export default function Vault() {
  const [stage, setStage] = useState<Stage>('choose');
  const [pin, setPin] = useState('');

  const onFaceId = async () => {
    const ok = await authenticate('Secure your GAMI vault');
    if (ok) {
      await setVaultMode('biometric');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      proceed();
    }
  };

  const onSkip = async () => {
    await setVaultMode('skip');
    proceed();
  };

  const pushDigit = (d: string) => {
    if (pin.length >= 6) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      void (async () => {
        await setVaultMode('pin', next);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        proceed();
      })();
    }
  };

  const popDigit = () => setPin((p) => p.slice(0, -1));

  return (
    <OnboardingScreen step={1} showBack>
      <View style={{ flex: 1 }}>
        <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>Lock it</Display>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>
            with your{' '}
          </Display>
          <Display style={{ fontSize: 32, color: COLORS.magenta, lineHeight: 36 }}>face.</Display>
        </View>
        <Body style={{ marginTop: 12, color: COLORS.muted, fontSize: 13, maxWidth: 280 }}>
          Your wallet only opens for you. No peeking.
        </Body>

        {stage === 'choose' ? (
          <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
            <View style={{ alignItems: 'center' }}>
              <StickerCard fill={COLORS.purple} offset={6} rotate={-3} className="p-8">
                <ScanFace color={COLORS.white} size={64} />
              </StickerCard>
            </View>

            <View style={{ marginTop: 12, gap: 12 }}>
              <PrimaryButton label="Use Face ID" color="purple" onPress={onFaceId} />
              <Pressable onPress={() => setStage('pin')}>
                <StickerCard fill={COLORS.card} offset={5} className="py-4">
                  <Display style={{ fontSize: 16, color: COLORS.white, textAlign: 'center' }}>
                    USE A 6-DIGIT PIN
                  </Display>
                </StickerCard>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View
              style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 }}
            >
              {Array.from({ length: 6 }, (_, i) => `pin-${i}`).map((id, i) => (
                <View
                  key={id}
                  style={{
                    width: 32,
                    height: 40,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    backgroundColor: i < pin.length ? COLORS.lime : COLORS.card,
                  }}
                />
              ))}
            </View>
            <Keypad onDigit={pushDigit} onDelete={popDigit} />
          </View>
        )}

        {stage === 'choose' && (
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <TapeLabel label="⚠ NO RECOVERY IF YOU SKIP" color="yellow" rotate={-2} />
            <Pressable onPress={onSkip} hitSlop={10}>
              <Mono style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONTS.monoBold }}>
                SKIP FOR NOW
              </Mono>
            </Pressable>
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
}

function Keypad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'gap', '0', 'del'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
      {keys.map((k) => {
        if (k === 'gap') return <View key="gap" style={{ width: 72, height: 56 }} />;
        const isDel = k === 'del';
        return (
          <Pressable
            key={k}
            onPress={() => (isDel ? onDelete() : onDigit(k))}
            style={{ width: 72, height: 56 }}
          >
            <StickerCard
              fill={isDel ? COLORS.inkSoft : COLORS.card}
              offset={4}
              className="flex-1 items-center justify-center"
            >
              {isDel ? (
                <Delete color={COLORS.magenta} size={22} />
              ) : (
                <Mono style={{ fontSize: 22, color: COLORS.white, fontFamily: FONTS.monoBold }}>
                  {k}
                </Mono>
              )}
            </StickerCard>
          </Pressable>
        );
      })}
    </View>
  );
}
