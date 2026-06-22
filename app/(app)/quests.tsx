import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Lock, Plus, Sparkles } from 'lucide-react-native';

import { ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { ACTION_LABEL, type Quest } from '@/lib/quests';
import { completeRemoteQuest, useQuests, verifyQuest } from '@/lib/store/questStore';
import { useGameStore } from '@/lib/store/gameStore';
import { useSession } from '@/lib/auth/session';
import { fireEvent } from '@/lib/events';
import { Body, Display, Mono, RadialBloom, StickerCard, TapeLabel } from '@/components/sticker';

const ORIGIN_LABEL: Record<Quest['origin'], string> = {
  seed: 'GAMI',
  ai: 'NOVA AI',
  business: 'BRAND',
  user: 'CUSTOM',
};

function seedRoute(quest: Quest) {
  if (quest.id === 'QUEST_002') return ROUTES.receive;
  if (quest.id === 'QUEST_003') return ROUTES.send;
  if (quest.id === 'QUEST_004') return ROUTES.novaTab;
  return ROUTES.home;
}

function QuestCard({
  quest,
  done,
  busy,
  onPress,
}: {
  quest: Quest;
  done: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const accent = ACCENT_HEX[quest.accent];
  return (
    <Pressable onPress={onPress} disabled={busy}>
      <StickerCard fill={COLORS.card} offset={6}>
        <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>
              {quest.code}
            </Mono>
            <View
              style={{
                backgroundColor: COLORS.inkSoft,
                borderWidth: 1,
                borderColor: COLORS.black,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Mono style={{ fontSize: 8, color: COLORS.cyan, letterSpacing: 1 }}>
                {ORIGIN_LABEL[quest.origin]}
              </Mono>
            </View>
            {quest.action.type !== 'none' ? (
              <Mono style={{ fontSize: 8, color: COLORS.muted, letterSpacing: 1 }}>
                {ACTION_LABEL[quest.action.type].toUpperCase()}
                {quest.action.chain ? ` · ${quest.action.chain.toUpperCase()}` : ''}
              </Mono>
            ) : null}
          </View>
          {quest.novaPick ? (
            <TapeLabel label="NOVA PICK" color="purple" textColor={COLORS.white} rotate={-3} />
          ) : done ? (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Check color={COLORS.lime} size={16} />
              <Mono style={{ fontSize: 10, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                DONE
              </Mono>
            </View>
          ) : null}
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
  const { quests, completedIds, loading, refresh } = useQuests();
  const { session } = useSession();
  const signedIn = Boolean(session);
  const badges = useGameStore((s) => s.badges);
  const completedQuests = useGameStore((s) => s.completedQuests);
  const grantXp = useGameStore((s) => s.grantXp);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const isDone = useCallback(
    (q: Quest) => {
      if (q.id === 'QUEST_001') return badges.includes('STARTER');
      if (q.isSeed) return completedQuests.includes(q.id);
      return completedIds.includes(q.id);
    },
    [badges, completedQuests, completedIds],
  );

  const handlePress = useCallback(
    async (quest: Quest) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNotice(null);

      // Seed quests deep-link into their flow (existing behaviour).
      if (quest.isSeed) {
        router.push(seedRoute(quest));
        return;
      }
      if (isDone(quest)) return;
      if (!signedIn) {
        router.push(ROUTES.signIn);
        return;
      }

      setBusyId(quest.id);
      try {
        const verdict = await verifyQuest(quest);
        if (!verdict.ok) {
          setNotice(verdict.reason ?? 'Quest condition not met yet.');
          return;
        }
        const result = await completeRemoteQuest(quest.id);
        if (!result) {
          setNotice('Could not record completion. Try again.');
          return;
        }
        if (result.awarded > 0) {
          grantXp(result.awarded);
          void fireEvent('quest.completed', { quest_id: quest.id, xp: result.awarded });
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNotice(`+${result.awarded} XP — quest complete!`);
        }
        await refresh();
      } finally {
        setBusyId(null);
      }
    },
    [isDone, signedIn, grantXp, refresh],
  );

  const doneCount = quests.filter(isDone).length;
  const total = quests.length;

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={COLORS.lime}
          />
        }
      >
        <View className="flex-row items-end justify-between py-3">
          <View>
            <Display style={{ fontSize: 26, color: COLORS.white }}>QUESTS</Display>
            <Mono
              style={{ fontSize: 12, color: COLORS.lime, fontFamily: FONTS.monoBold, marginTop: 6 }}
            >
              {doneCount}/{total} COMPLETE
            </Mono>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(ROUTES.questBuilder);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: COLORS.lime,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 12,
              paddingVertical: 9,
            }}
          >
            <Plus color={COLORS.black} size={16} />
            <Mono style={{ fontSize: 12, color: COLORS.black, fontFamily: FONTS.monoBold }}>
              NEW
            </Mono>
          </Pressable>
        </View>

        <View
          style={{
            height: 8,
            borderWidth: 2,
            borderColor: COLORS.black,
            backgroundColor: COLORS.inkSoft,
            flexDirection: 'row',
          }}
        >
          <View
            style={{
              width: `${total > 0 ? Math.round((doneCount / total) * 100) : 0}%`,
              backgroundColor: COLORS.lime,
            }}
          />
        </View>

        {notice ? (
          <StickerCard fill={COLORS.inkSoft} offset={4}>
            <Body style={{ fontSize: 13, color: COLORS.lime }}>{notice}</Body>
          </StickerCard>
        ) : null}

        {!signedIn ? (
          <Pressable onPress={() => router.push(ROUTES.signIn)}>
            <StickerCard fill={COLORS.purple} offset={5}>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Sparkles color={COLORS.white} size={20} />
                <Body style={{ fontSize: 13, color: COLORS.white, flex: 1 }}>
                  Sign in to unlock AI + community quests and save your XP.
                </Body>
              </View>
            </StickerCard>
          </Pressable>
        ) : null}

        {quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            done={isDone(q)}
            busy={busyId === q.id}
            onPress={() => void handlePress(q)}
          />
        ))}

        <View style={{ marginTop: 6, opacity: 0.5 }}>
          <StickerCard fill={COLORS.inkSoft} offset={4}>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Lock color={COLORS.muted} size={20} />
              <Body style={{ fontSize: 13, color: COLORS.muted, flex: 1 }}>
                Build your own with the NEW button, or let NOVA generate one.
              </Body>
            </View>
          </StickerCard>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
