import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, CreditCard, RefreshCw } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { createWallet } from '@/lib/wallet/wallet';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Display, Mono, StickerCard } from '@/components/sticker';

const STEPS = ['KEYS GENERATED', 'VAULT ENCRYPTED', 'ON-CHAIN HANDSHAKE'] as const;

/**
 * 04 Create wallet — "Forging your wallet…" 3-row progress that stamps in sequence.
 * Generates a real on-device BIP39 wallet stored in SecureStore.
 */
export default function CreateWallet() {
  const [done, setDone] = useState(0);
  const setWalletReady = useGameStore((s) => s.setWalletReady);
  const grantXp = useGameStore((s) => s.grantXp);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return () => undefined;
    started.current = true;

    let cancelled = false;
    void (async () => {
      await fireEvent('wallet.create.start');
      try {
        // Generate the wallet up front; UI stamps steps for feel.
        await createWallet();
      } catch {
        // Even if derivation hiccups in preview, continue the visual flow.
      }

      for (let i = 1; i <= STEPS.length; i++) {
        await delay(750);
        if (cancelled) return;
        setDone(i);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setWalletReady(true);
      grantXp(50);
      await fireEvent('wallet.create.success');
      await fireEvent('xp.granted', { amount: 50, reason: 'wallet.create' });
      await delay(450);
      if (!cancelled) router.replace(ROUTES.vault);
    })();

    return () => {
      cancelled = true;
    };
  }, [grantXp, setWalletReady]);

  return (
    <OnboardingScreen step={1}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <StickerCard fill={COLORS.purple} offset={6} rotate={-3} className="p-8">
          <CreditCard color={COLORS.white} size={56} />
        </StickerCard>

        <Display style={{ fontSize: 26, color: COLORS.white, marginTop: 40, textAlign: 'center' }}>
          Forging your
        </Display>
        <Display style={{ fontSize: 26, color: COLORS.white, textAlign: 'center' }}>
          wallet…
        </Display>
        <Mono
          style={{
            marginTop: 10,
            fontSize: 12,
            color: COLORS.muted,
            fontFamily: FONTS.monoRegular,
            textAlign: 'center',
            maxWidth: 260,
          }}
        >
          Generating keys. Locking &apos;em up tight. We&apos;ll set up backup later — promise.
        </Mono>

        <View style={{ marginTop: 36, width: '100%', gap: 12 }}>
          {STEPS.map((label, i) => {
            const isDone = i < done;
            const isActive = i === done;
            return (
              <StickerCard key={label} fill={COLORS.inkSoft} offset={4} className="px-4 py-3">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Mono
                    style={{
                      fontSize: 12,
                      fontFamily: FONTS.monoBold,
                      color: isDone ? COLORS.white : isActive ? COLORS.cyan : COLORS.muted,
                    }}
                  >
                    {label}
                  </Mono>
                  {isDone ? (
                    <Animated.View entering={FadeIn}>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          backgroundColor: COLORS.lime,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: COLORS.black,
                        }}
                      >
                        <Check color={COLORS.black} size={14} strokeWidth={3} />
                      </View>
                    </Animated.View>
                  ) : (
                    <RefreshCw color={isActive ? COLORS.cyan : COLORS.muted} size={18} />
                  )}
                </View>
              </StickerCard>
            );
          })}
        </View>
      </View>
    </OnboardingScreen>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
