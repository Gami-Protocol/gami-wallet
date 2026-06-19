import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { useGameStore } from '@/lib/store/gameStore';
import { BlockProgress, Display, Mono, RadialBloom, StickerCard } from '@/components/sticker';
import { fireEvent } from '@/lib/events';

/**
 * 01 Splash — GAMI / WALLET logo tile + smiley sticker, "▸ PLAY · EARN · OWN ◂",
 * block-progress bar, auto-redirects to Home (returning) or Welcome (new).
 */
export default function Splash() {
  const [progress, setProgress] = useState(0);
  const onboarded = useGameStore((s) => s.onboarded);

  useEffect(() => {
    void fireEvent('app.launch');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const start = Date.now();
    const duration = 1400;
    const id = setInterval(() => {
      const ratio = Math.min((Date.now() - start) / duration, 1);
      setProgress(ratio);
      if (ratio >= 1) {
        clearInterval(id);
        router.replace(onboarded ? ROUTES.home : ROUTES.welcome);
      }
    }, 60);
    return () => clearInterval(id);
  }, [onboarded]);

  return (
    <RadialBloom>
      <View className="pb-safe-offset-10 flex-1 items-center justify-center px-6">
        <View style={{ alignItems: 'center', gap: 18 }}>
          {/* Smiley sticker */}
          <StickerCard fill={COLORS.purple} offset={5} rotate={-4} className="p-0">
            <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
              <Display style={{ fontSize: 34, color: COLORS.white }}>:)</Display>
            </View>
          </StickerCard>

          {/* GAMI / WALLET logo tiles */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Display style={{ fontSize: 52, color: COLORS.white, letterSpacing: -1 }}>GAMI</Display>
            <View
              style={{
                backgroundColor: COLORS.purple,
                paddingHorizontal: 14,
                paddingVertical: 2,
                borderWidth: 2,
                borderColor: COLORS.black,
              }}
            >
              <Display style={{ fontSize: 52, color: COLORS.white, letterSpacing: -1 }}>
                WALLET
              </Display>
            </View>
          </View>

          <Mono style={{ fontSize: 12, letterSpacing: 3, color: COLORS.lime }}>
            ▸ PLAY · EARN · OWN ◂
          </Mono>
        </View>

        <View style={{ position: 'absolute', bottom: 60, left: 24, right: 24, gap: 8 }}>
          <BlockProgress progress={progress} blocks={12} fill={COLORS.magenta} height={10} />
          <Mono
            style={{
              fontSize: 10,
              color: COLORS.muted,
              fontFamily: FONTS.monoRegular,
              alignSelf: 'center',
            }}
          >
            v1.0.0 · LOADING {Math.round(progress * 100)}%
          </Mono>
        </View>
      </View>
    </RadialBloom>
  );
}
