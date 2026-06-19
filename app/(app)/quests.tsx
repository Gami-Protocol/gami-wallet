import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Lock } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { type Quest, QUESTS } from '@/lib/quests';
import { ACCENT_HEX } from '@/lib/theme';
import { useGameStore } from '@/lib/store/gameStore';
import { Body, Display, Mono, RadialBloom, StickerCard, TapeLabel } from '@/components/sticker';

function QuestCard({ quest, done }: { quest: Quest; done: boolean }) {
  const accent = ACCENT_HEX[quest.accent];
  const route =
    quest.id === 'QUEST_002'
      ? ROUTES.receive
      : quest.id === 'QUEST_003'
        ? ROUTES.send
        : quest.id === 'QUEST_004'
          ? ROUTES.novaTab
          : ROUTES.home;

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(route);
      }}
    >
      <StickerCard fill={COLORS.card} offset={6}>
        <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
          <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>{quest.code}</Mono>
          {quest.novaPick && (
            <TapeLabel label="NOVA PICK" color="purple" textColor={COLORS.white} rotate={-3} />
          )}
          {done && (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Check color={COLORS.lime} size={16} />
              <Mono style={{ fontSize: 10, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                DONE
              </Mono>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-12">
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: accent,
              borderWidth: 2,
              borderColor: COLORS.black,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {done ? (
              <Check color={COLORS.black} size={24} />
            ) : (
              <Mono style={{ fontSize: 16, color: COLORS.black, fontFamily: FONTS.monoBold }}>
                {quest.code.slice(-1)}
              </Mono>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Display style={{ fontSize: 18, color: COLORS.white }}>{quest.title}</Display>
            <Body style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{quest.blurb}</Body>
          </View>
          <View
            style={{
              backgroundColor: COLORS.lime,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Mono style={{ fontSize: 12, color: COLORS.black, fontFamily: FONTS.monoBold }}>
              +{quest.xp}
            </Mono>
          </View>
        </View>
      </StickerCard>
    </Pressable>
  );
}

export default function QuestsScreen() {
  const completedQuests = useGameStore((s) => s.completedQuests);
  const badges = useGameStore((s) => s.badges);

  const isDone = (q: Quest) => {
    if (q.id === 'QUEST_001') return badges.includes('STARTER');
    return completedQuests.includes(q.id);
  };

  const total = QUESTS.length;
  const doneCount = QUESTS.filter(isDone).length;

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
      >
        <View className="py-3">
          <Display style={{ fontSize: 26, color: COLORS.white }}>QUESTS</Display>
          <View className="flex-row items-center" style={{ gap: 8, marginTop: 6 }}>
            <Mono style={{ fontSize: 12, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
              {doneCount}/{total} COMPLETE
            </Mono>
            <View
              style={{
                flex: 1,
                height: 8,
                borderWidth: 2,
                borderColor: COLORS.black,
                backgroundColor: COLORS.inkSoft,
                flexDirection: 'row',
              }}
            >
              <View
                style={{
                  width: `${Math.round((doneCount / total) * 100)}%`,
                  backgroundColor: COLORS.lime,
                }}
              />
            </View>
          </View>
        </View>

        {QUESTS.map((q) => (
          <QuestCard key={q.id} quest={q} done={isDone(q)} />
        ))}

        <View style={{ marginTop: 6, opacity: 0.5 }}>
          <StickerCard fill={COLORS.inkSoft} offset={4}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Lock color={COLORS.muted} size={20} />
              <Body style={{ fontSize: 13, color: COLORS.muted, flex: 1 }}>
                More quests unlock as you level up.
              </Body>
            </View>
          </StickerCard>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
