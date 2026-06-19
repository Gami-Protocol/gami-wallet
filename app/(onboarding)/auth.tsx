import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { type Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Apple, Download } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, Mono, StickerCard, TapeLabel } from '@/components/sticker';

/**
 * 03 Auth — "Choose your start." Primary CREATE NEW WALLET sticker (+50 XP tape),
 * plus Google / Apple / Import buttons.
 */
export default function Auth() {
  const [busy, setBusy] = useState(false);

  const select = async (method: string, to: Href) => {
    if (busy) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fireEvent('onboarding.auth.method_selected', { method });
    router.push(to);
  };

  return (
    <OnboardingScreen step={0} showBack>
      <View style={{ flex: 1 }}>
        <Display style={{ fontSize: 34, color: COLORS.white, lineHeight: 38 }}>Choose your</Display>
        <Display style={{ fontSize: 34, color: COLORS.white, lineHeight: 38 }}>start.</Display>
        <Body style={{ marginTop: 12, color: COLORS.muted, fontSize: 13 }}>
          You can switch later. No pressure.
        </Body>

        {/* Primary CREATE NEW WALLET */}
        <View style={{ marginTop: 28 }}>
          <Pressable onPress={() => select('create', ROUTES.createWallet)}>
            <StickerCard fill={COLORS.purple} offset={6} className="p-5">
              <View style={{ position: 'absolute', right: -6, top: -10, zIndex: 2 }}>
                <TapeLabel label="+50 XP" color="magenta" rotate={6} />
              </View>
              <Mono
                style={{
                  fontSize: 11,
                  color: COLORS.cyan,
                  fontFamily: FONTS.monoBold,
                  letterSpacing: 1,
                }}
              >
                ▸ RECOMMENDED
              </Mono>
              <Display style={{ fontSize: 24, color: COLORS.white, marginTop: 6 }}>
                CREATE NEW WALLET
              </Display>
              <Body style={{ marginTop: 6, color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Fresh keys, generated on your device. We never see them.
              </Body>
            </StickerCard>
          </Pressable>
        </View>

        <View style={{ marginTop: 26, gap: 12 }}>
          <AuthRow
            label="GOOGLE"
            hint="1-tap auth"
            onPress={() => select('google', ROUTES.createWallet)}
            leading={<GoogleMark />}
          />
          <AuthRow
            label="APPLE"
            hint="Face ID"
            onPress={() => select('apple', ROUTES.createWallet)}
            leading={<Apple color={COLORS.white} size={20} />}
          />
          <AuthRow
            label="I HAVE A WALLET — IMPORT IT"
            onPress={() => select('import', ROUTES.createWallet)}
            leading={<Download color={COLORS.lime} size={18} />}
            mono
          />
        </View>

        <View style={{ flex: 1 }} />
        <Mono
          style={{
            fontSize: 10,
            color: COLORS.muted,
            fontFamily: FONTS.monoRegular,
            alignSelf: 'center',
            textAlign: 'center',
          }}
        >
          SSO IS AUTH-ONLY · YOUR WALLET STAYS ON DEVICE
        </Mono>
      </View>
    </OnboardingScreen>
  );
}

function AuthRow({
  label,
  hint,
  leading,
  onPress,
  mono = false,
}: {
  label: string;
  hint?: string;
  leading?: React.ReactNode;
  onPress: () => void;
  mono?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <StickerCard fill={COLORS.card} offset={5} className="px-4 py-3">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {leading}
          {mono ? (
            <Mono style={{ flex: 1, fontSize: 12, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
              {label}
            </Mono>
          ) : (
            <Display style={{ flex: 1, fontSize: 16, color: COLORS.white }}>{label}</Display>
          )}
          {hint ? (
            <Mono style={{ fontSize: 10, color: COLORS.muted, fontFamily: FONTS.monoRegular }}>
              {hint}
            </Mono>
          ) : null}
        </View>
      </StickerCard>
    </Pressable>
  );
}

function GoogleMark() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Mono style={{ fontSize: 13, color: '#4285F4', fontFamily: FONTS.monoBold }}>G</Mono>
    </View>
  );
}
