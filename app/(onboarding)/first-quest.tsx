import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, Mono, PrimaryButton, StickerCard, TapeLabel } from '@/components/sticker';

type Step = { id: string; label: string; done: boolean };

/**
 * 09 First quest — "First Steps" tutorial quest (QUEST_001) with a 5-step
 * checklist and reward chips (+250 XP, Starter badge).
 */
export default function FirstQuest() {
  const walletReady = useGameStore((s) => s.walletReady);
  const handle = useGameStore((s) => s.handle);
  const interests = useGameStore((s) => s.interests);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);

  const steps: Step[] = useMemo(
    () => [
      { id: 'create', label: 'Create your wallet', done: walletReady },
      { id: 'handle', label: 'Pick your handle', done: Boolean(handle) },
      { id: 'interests', label: 'Choose your interests', done: interests.length >= 3 },
      { id: 'notifications', label: 'Enable notifications', done: notificationsEnabled },
      { id: 'reward', label: 'Claim your reward', done: false },
    ],
    [walletReady, handle, interests, notificationsEnabled],
  );

  const completed = steps.filter((s) => s.done).length;

  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    steps.forEach((s) => {
      if (s.done && s.id !== 'reward') {
        void fireEvent('quest.001.step_complete', { step: s.id });
      }
    });
  }, [steps]);

  return (
    <OnboardingScreen step={3} showBack>
      <View style={{ flex: 1 }}>
        <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>
          First Steps.
        </Display>
        <Body style={{ marginTop: 12, color: COLORS.muted, fontSize: 13 }}>
          Knock these out to bank your first reward.
        </Body>

        <View style={{ marginTop: 22 }}>
          <StickerCard fill={COLORS.card} offset={6} className="p-5">
            <View style={{ position: 'absolute', right: -6, top: -10, zIndex: 2 }}>
              <TapeLabel label="QUEST_001" color="lime" rotate={5} />
            </View>
            <Mono
              style={{
                fontSize: 11,
                color: COLORS.cyan,
                fontFamily: FONTS.monoBold,
                letterSpacing: 1,
              }}
            >
              ▸ TUTORIAL QUEST
            </Mono>
            <Display style={{ fontSize: 22, color: COLORS.white, marginTop: 6 }}>
              FIRST STEPS
            </Display>

            {/* Progress */}
            <Mono
              style={{
                marginTop: 4,
                fontSize: 11,
                color: COLORS.muted,
                fontFamily: FONTS.monoRegular,
              }}
            >
              {completed}/{steps.length} COMPLETE
            </Mono>

            {/* Checklist */}
            <View style={{ marginTop: 16, gap: 12 }}>
              {steps.map((s) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderWidth: 2,
                      borderColor: COLORS.black,
                      backgroundColor: s.done ? COLORS.lime : COLORS.inkSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.done && (
                      <Mono
                        style={{ fontSize: 13, color: COLORS.black, fontFamily: FONTS.monoBold }}
                      >
                        ✓
                      </Mono>
                    )}
                  </View>
                  <Body
                    style={{
                      fontSize: 14,
                      color: s.done ? COLORS.white : COLORS.muted,
                      textDecorationLine: s.done ? 'line-through' : 'none',
                      flex: 1,
                    }}
                  >
                    {s.label}
                  </Body>
                </View>
              ))}
            </View>

            {/* Reward chips */}
            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
              <RewardChip label="+250 XP" color={COLORS.purple} textColor={COLORS.white} />
              <RewardChip label="STARTER BADGE" color={COLORS.yellow} textColor={COLORS.black} />
            </View>
          </StickerCard>
        </View>

        <View style={{ flex: 1 }} />
        <PrimaryButton
          label="Claim reward"
          color="purple"
          onPress={() => router.push(ROUTES.starterPack)}
        />
      </View>
    </OnboardingScreen>
  );
}

function RewardChip({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View
      style={{
        backgroundColor: color,
        borderWidth: 2,
        borderColor: COLORS.black,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Mono
        style={{ fontSize: 12, color: textColor, fontFamily: FONTS.monoBold, letterSpacing: 0.5 }}
      >
        {label}
      </Mono>
    </View>
  );
}
