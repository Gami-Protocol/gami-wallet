import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, Mono, PrimaryButton, ScribbleUnderline } from '@/components/sticker';

const INTERESTS = [
  'Gaming',
  'DeFi',
  'NFTs',
  'Airdrops',
  'Memes',
  'DAOs',
  'AI',
  'Trading',
  'Community',
];

const MIN = 3;

/**
 * 08 Interests — "What's your vibe?" Chip grid requiring at least 3 selections.
 */
export default function Interests() {
  const storeInterests = useGameStore((s) => s.interests);
  const setInterests = useGameStore((s) => s.setInterests);
  const [selected, setSelected] = useState<string[]>(storeInterests);

  const toggle = (tag: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const enough = selected.length >= MIN;
  const remaining = MIN - selected.length;

  const onContinue = async () => {
    if (!enough) return;
    setInterests(selected);
    await fireEvent('onboarding.interests.selected', { interests: selected });
    router.push(ROUTES.firstQuest);
  };

  return (
    <OnboardingScreen step={2} showBack>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>
            What&apos;s your{' '}
          </Display>
          <Display style={{ fontSize: 32, color: COLORS.lime, lineHeight: 36 }}>vibe?</Display>
        </View>
        <View style={{ marginTop: 2, marginLeft: 4 }}>
          <ScribbleUnderline width={90} color={COLORS.lime} />
        </View>
        <Body style={{ marginTop: 14, color: COLORS.muted, fontSize: 13 }}>
          Pick at least {MIN}. NOVA tunes quests + alpha to your taste.
        </Body>

        <View style={{ marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {INTERESTS.map((tag) => {
            const isSel = selected.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggle(tag)}>
                <View
                  style={{
                    backgroundColor: isSel ? COLORS.purple : COLORS.card,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    borderRadius: 999,
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSel && (
                    <Mono style={{ fontSize: 13, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                      ✓
                    </Mono>
                  )}
                  <Body
                    style={{
                      fontSize: 14,
                      color: isSel ? COLORS.white : COLORS.muted,
                      fontFamily: FONTS.bodyBold,
                    }}
                  >
                    {tag}
                  </Body>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Mono
            style={{
              fontSize: 12,
              color: enough ? COLORS.lime : COLORS.muted,
              fontFamily: FONTS.monoBold,
              letterSpacing: 1,
            }}
          >
            {enough ? `${selected.length} SELECTED · READY` : `PICK ${remaining} MORE`}
          </Mono>
        </View>
        <PrimaryButton label="Continue" color="purple" disabled={!enough} onPress={onContinue} />
      </View>
    </OnboardingScreen>
  );
}
