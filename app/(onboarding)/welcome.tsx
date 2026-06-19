import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Bot, Lock, Sparkles, Trophy } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import {
  Body,
  Display,
  Mono,
  PrimaryButton,
  ScribbleUnderline,
  StickerCard,
  TapeLabel,
} from '@/components/sticker';

type Feature = {
  title: string;
  icon: typeof Trophy;
  fill: string;
  iconColor: string;
};

const FEATURES: Feature[] = [
  { title: 'XP ON EVERY ACTION', icon: Sparkles, fill: COLORS.magenta, iconColor: COLORS.black },
  { title: 'QUESTS + REWARDS', icon: Trophy, fill: COLORS.purple, iconColor: COLORS.white },
  { title: 'NON-CUSTODIAL', icon: Lock, fill: COLORS.cyan, iconColor: COLORS.black },
  { title: 'AI AGENT INSIDE', icon: Bot, fill: COLORS.lime, iconColor: COLORS.black },
];

/**
 * 02 Welcome — "Your wallet, but make it FUN." + 2x2 feature tiles.
 */
export default function Welcome() {
  useEffect(() => {
    void fireEvent('onboarding.welcome.view');
  }, []);

  return (
    <OnboardingScreen step={0}>
      <View style={{ flex: 1 }}>
        <View style={{ marginBottom: 4 }}>
          <TapeLabel label="ALPHA" color="magenta" rotate={-4} />
        </View>

        <View style={{ marginTop: 12 }}>
          <Display style={{ fontSize: 40, color: COLORS.white, lineHeight: 42 }}>
            Your wallet,
          </Display>
          <Display style={{ fontSize: 40, color: COLORS.white, lineHeight: 42 }}>
            but make it
          </Display>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Display style={{ fontSize: 40, color: COLORS.magenta, lineHeight: 44 }}>FUN.</Display>
          </View>
          <View style={{ marginTop: 2, marginLeft: 2 }}>
            <ScribbleUnderline width={96} height={12} color={COLORS.magenta} />
          </View>
        </View>

        <Body
          style={{
            marginTop: 16,
            color: COLORS.muted,
            fontSize: 14,
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          Stack XP. Smash quests. Earn real rewards across every chain you touch. Let&apos;s gooo.
        </Body>

        <View style={{ marginTop: 28, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {FEATURES.slice(0, 2).map((f) => (
              <FeatureTile key={f.title} feature={f} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {FEATURES.slice(2, 4).map((f) => (
              <FeatureTile key={f.title} feature={f} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <PrimaryButton label="Let's go" color="purple" onPress={() => router.push(ROUTES.auth)} />
        <Mono
          style={{
            marginTop: 14,
            fontSize: 10,
            color: COLORS.muted,
            fontFamily: FONTS.monoRegular,
            alignSelf: 'center',
          }}
        >
          NON-CUSTODIAL · YOUR KEYS · YOUR COINS
        </Mono>
      </View>
    </OnboardingScreen>
  );
}

function FeatureTile({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <View style={{ flex: 1 }}>
      <StickerCard fill={COLORS.card} offset={5} className="p-3" style={{ height: 96 }}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View
            style={{
              width: 34,
              height: 34,
              backgroundColor: feature.fill,
              borderWidth: 2,
              borderColor: COLORS.black,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon color={feature.iconColor} size={18} />
          </View>
          <Mono
            style={{
              fontSize: 11,
              color: COLORS.white,
              fontFamily: FONTS.monoBold,
              lineHeight: 14,
            }}
          >
            {feature.title}
          </Mono>
        </View>
      </StickerCard>
    </View>
  );
}
