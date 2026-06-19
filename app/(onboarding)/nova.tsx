import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import {
  Body,
  Display,
  Mono,
  NovaAvatar,
  PrimaryButton,
  ScribbleUnderline,
  StickerCard,
} from '@/components/sticker';

const CAPABILITIES = [
  { emoji: '🏆', label: 'QUESTS', color: COLORS.lime },
  { emoji: '⚡', label: 'TIMING', color: COLORS.yellow },
  { emoji: '✨', label: 'ALPHA', color: COLORS.cyan },
];

/**
 * 07 NOVA intro — "meet NOVA." Mascot orb, speech bubble, opt-in pill, and
 * three capability chips.
 */
export default function NovaIntro() {
  return (
    <OnboardingScreen step={2} showBack>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>meet </Display>
          <Display style={{ fontSize: 32, color: COLORS.magenta, lineHeight: 36 }}>NOVA.</Display>
        </View>
        <View style={{ marginTop: 2, marginLeft: 58 }}>
          <ScribbleUnderline width={120} color={COLORS.magenta} />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <NovaAvatar size={150} />
          </Animated.View>

          {/* Speech bubble */}
          <Animated.View entering={FadeInUp.delay(250).duration(400)} style={{ marginTop: 20 }}>
            <StickerCard fill={COLORS.card} offset={6} className="px-5 py-4">
              <Body style={{ color: COLORS.white, fontSize: 16, textAlign: 'center' }}>
                yo. i&apos;m your wallet&apos;s brain.
              </Body>
              <Body
                style={{
                  marginTop: 6,
                  color: COLORS.muted,
                  fontSize: 13,
                  textAlign: 'center',
                  maxWidth: 240,
                }}
              >
                I track quests, time your moves, and surface alpha — only when you want it.
              </Body>
            </StickerCard>
          </Animated.View>

          {/* Opt-in pill */}
          <Animated.View entering={FadeInUp.delay(450).duration(400)} style={{ marginTop: 16 }}>
            <View
              style={{
                backgroundColor: COLORS.yellow,
                borderWidth: 2,
                borderColor: COLORS.black,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Mono
                style={{
                  fontSize: 11,
                  color: COLORS.black,
                  fontFamily: FONTS.monoBold,
                  letterSpacing: 1,
                }}
              >
                ◆ OPT-IN ONLY
              </Mono>
            </View>
          </Animated.View>
        </View>

        {/* Capability chips */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(400)}
          style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 18 }}
        >
          {CAPABILITIES.map((c) => (
            <View
              key={c.label}
              style={{
                flex: 1,
                backgroundColor: COLORS.inkSoft,
                borderWidth: 2,
                borderColor: COLORS.black,
                paddingVertical: 12,
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Body style={{ fontSize: 18 }}>{c.emoji}</Body>
              <Mono
                style={{
                  fontSize: 10,
                  color: c.color,
                  fontFamily: FONTS.monoBold,
                  letterSpacing: 1,
                }}
              >
                {c.label}
              </Mono>
            </View>
          ))}
        </Animated.View>

        <PrimaryButton
          label="Let's go"
          color="purple"
          onPress={() => router.push(ROUTES.interests)}
        />
      </View>
    </OnboardingScreen>
  );
}
