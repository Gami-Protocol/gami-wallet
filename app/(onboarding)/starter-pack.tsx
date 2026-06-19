import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { type AccentColor, ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Display, Mono, PrimaryButton, StickerCard } from '@/components/sticker';

const STARTER_XP = 250;
const STARTER_BADGE = 'Starter';

type RewardCard = {
  tape: string;
  title: string;
  color: AccentColor;
  rotate: number;
  delay: number;
};

const CARDS: RewardCard[] = [
  { tape: 'BADGE', title: 'STARTER', color: 'yellow', rotate: -6, delay: 200 },
  { tape: 'XP', title: '+250 XP', color: 'purple', rotate: 4, delay: 450 },
  { tape: 'CREDIT', title: '1× MINT', color: 'magenta', rotate: -3, delay: 700 },
];

// Simple confetti specks scattered behind the cards.
const CONFETTI: {
  id: string;
  left: `${number}%`;
  top: `${number}%`;
  color: string;
  rotate: number;
  size: number;
}[] = Array.from({ length: 28 }, (_, i) => {
  const colors: AccentColor[] = ['purple', 'magenta', 'lime', 'yellow', 'cyan'];
  return {
    id: `c-${i}`,
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    color: ACCENT_HEX[colors[i % colors.length]],
    rotate: (i * 23) % 360,
    size: 6 + (i % 4) * 3,
  };
});

/**
 * 10 Starter pack reveal — confetti, 3 overlapping sticker cards that
 * parachute in with a spring. Grants +250 XP + Starter badge on mount.
 */
export default function StarterPack() {
  const grantXp = useGameStore((s) => s.grantXp);
  const earnBadge = useGameStore((s) => s.earnBadge);

  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void (async () => {
      grantXp(STARTER_XP);
      earnBadge(STARTER_BADGE);
      await fireEvent('quest.001.complete', { quest: 'QUEST_001' });
      await fireEvent('quest.reward.claimed', { xp: STARTER_XP, badge: STARTER_BADGE });
      await fireEvent('xp.granted', { amount: STARTER_XP, source: 'QUEST_001' });
      await fireEvent('badge.earned', { badge: STARTER_BADGE });
      // Success haptic on the final card landing.
      setTimeout(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 950);
    })();
  }, [earnBadge, grantXp]);

  return (
    <OnboardingScreen step={3}>
      <View style={{ flex: 1 }}>
        {/* Confetti */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {CONFETTI.map((c) => (
            <Animated.View
              key={c.id}
              entering={FadeIn.delay(150).duration(500)}
              style={{
                position: 'absolute',
                left: c.left,
                top: c.top,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                transform: [{ rotate: `${c.rotate}deg` }],
              }}
            />
          ))}
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Display style={{ fontSize: 30, color: COLORS.white, textAlign: 'center' }}>
            STARTER PACK
          </Display>
          <Mono
            style={{
              marginTop: 6,
              fontSize: 12,
              color: COLORS.lime,
              fontFamily: FONTS.monoBold,
              letterSpacing: 1,
            }}
          >
            ▸ UNLOCKED ◂
          </Mono>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: -8 }}>
          {CARDS.map((c) => (
            <ParachuteCard key={c.title} card={c} />
          ))}
        </View>

        <PrimaryButton
          label="Nice — continue"
          color="purple"
          onPress={() => router.push(ROUTES.permissions)}
        />
      </View>
    </OnboardingScreen>
  );
}

function ParachuteCard({ card }: { card: RewardCard }) {
  const translateY = useSharedValue(-260);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(card.delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      card.delay,
      withSpring(0, { damping: 9, stiffness: 120, mass: 0.9 }),
    );
  }, [card.delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: `${card.rotate}deg` }],
  }));

  return (
    <Animated.View style={[{ marginVertical: 6 }, style]}>
      <StickerCard
        fill={ACCENT_HEX[card.color]}
        offset={6}
        className="px-7 py-5"
        style={{ width: 230 }}
      >
        <Mono
          style={{
            fontSize: 11,
            color: COLORS.black,
            fontFamily: FONTS.monoBold,
            letterSpacing: 2,
          }}
        >
          {card.tape}
        </Mono>
        <Display
          style={{
            fontSize: 26,
            color: card.color === 'purple' ? COLORS.white : COLORS.black,
            marginTop: 4,
          }}
        >
          {card.title}
        </Display>
      </StickerCard>
    </Animated.View>
  );
}
