import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowDownLeft, ArrowUpRight, Compass, Wallet } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { SEED_QUESTS } from '@/lib/quests';
import { useGameStore, xpProgress } from '@/lib/store/gameStore';
import {
  Body,
  CharacterTile,
  Display,
  Mono,
  NovaAvatar,
  RadialBloom,
  StickerCard,
  TapeLabel,
} from '@/components/sticker';
import { useEffect } from 'react';

const QUICK_ACTIONS = [
  { key: 'send', label: 'SEND', icon: ArrowUpRight, color: COLORS.magenta },
  { key: 'receive', label: 'RECEIVE', icon: ArrowDownLeft, color: COLORS.cyan },
  { key: 'quests', label: 'QUESTS', icon: Compass, color: COLORS.lime },
  { key: 'stash', label: 'STASH', icon: Wallet, color: COLORS.yellow },
] as const;

function QuickAction({
  label,
  Icon,
  color,
  onPress,
}: {
  label: string;
  Icon: typeof Wallet;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{ flex: 1 }}
    >
      <StickerCard fill={COLORS.card} offset={5} className="items-center px-2 py-4">
        <View
          style={{
            width: 44,
            height: 44,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: COLORS.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon color={COLORS.black} size={22} />
        </View>
        <Mono
          style={{
            marginTop: 8,
            fontSize: 10,
            color: COLORS.white,
            fontFamily: FONTS.monoBold,
            letterSpacing: 1,
          }}
        >
          {label}
        </Mono>
      </StickerCard>
    </Pressable>
  );
}

function go(key: string) {
  if (key === 'send') router.push(ROUTES.send);
  else if (key === 'receive') router.push(ROUTES.receive);
  else if (key === 'quests') router.push(ROUTES.quests);
  else router.push(ROUTES.stash);
}

export default function HomeScreen() {
  const handle = useGameStore((s) => s.handle);
  const character = useGameStore((s) => s.character);
  const characterColor = useGameStore((s) => s.characterColor);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const badges = useGameStore((s) => s.badges);

  const { into, total, ratio } = xpProgress(xp);
  const hasStarter = badges.includes('STARTER');
  const novaQuest = SEED_QUESTS.find((q) => q.novaPick) ?? SEED_QUESTS[1];

  useEffect(() => {
    void fireEvent('app.home.view');
  }, []);

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-row items-center gap-3">
            <CharacterTile id={character ?? 'NX'} color={characterColor ?? 'purple'} size={42} />
            <View>
              <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>HEY,</Mono>
              <Display style={{ fontSize: 18, color: COLORS.white }}>@{handle ?? 'player'}</Display>
            </View>
          </View>
          <TapeLabel label={`\u25b6 ${streak} DAY`} color="yellow" rotate={-4} />
        </View>

        {/* Hero LVL card */}
        <View style={{ marginTop: 12 }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 6,
              top: 6,
              right: -6,
              bottom: -6,
              backgroundColor: COLORS.black,
            }}
          />
          <LinearGradient
            colors={[COLORS.purple, COLORS.magenta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderWidth: 2, borderColor: COLORS.black, padding: 18 }}
          >
            <View className="flex-row items-start justify-between">
              <View
                style={{
                  backgroundColor: COLORS.ink,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Mono style={{ fontSize: 9, color: COLORS.lime, letterSpacing: 1 }}>LVL</Mono>
                <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 34 }}>
                  {level}
                </Display>
              </View>
              <View style={{ marginTop: -6, marginRight: -6 }}>
                <NovaAvatar size={64} glow={false} animated />
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
                <Mono style={{ fontSize: 11, color: COLORS.white, fontFamily: FONTS.monoBold }}>
                  XP
                </Mono>
                <Mono style={{ fontSize: 11, color: COLORS.white, fontFamily: FONTS.monoBold }}>
                  {into}/{total}
                </Mono>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  height: 14,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                  backgroundColor: COLORS.ink,
                }}
              >
                <View
                  style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: COLORS.lime }}
                />
              </View>
            </View>

            <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Display style={{ fontSize: 16, color: COLORS.white }}>WELCOME!</Display>
              <View
                style={{
                  backgroundColor: COLORS.yellow,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Mono style={{ fontSize: 11, color: COLORS.black, fontFamily: FONTS.monoBold }}>
                  +{into} XP
                </Mono>
              </View>
            </View>
            {hasStarter && (
              <View style={{ marginTop: 12 }}>
                <TapeLabel label="STARTER BADGE EARNED" color="lime" rotate={-2} />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={{ marginTop: 22, flexDirection: 'row', gap: 12 }}>
          {QUICK_ACTIONS.map((a) => (
            <QuickAction
              key={a.key}
              label={a.label}
              Icon={a.icon}
              color={a.color}
              onPress={() => go(a.key)}
            />
          ))}
        </View>

        {/* Active quest */}
        <View style={{ marginTop: 26 }}>
          <View className="flex-row items-center gap-2" style={{ marginBottom: 12 }}>
            <Display style={{ fontSize: 16, color: COLORS.white }}>ACTIVE QUEST</Display>
            <TapeLabel label="NOVA PICK" color="purple" textColor={COLORS.white} rotate={-3} />
          </View>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(ROUTES.quests);
            }}
          >
            <StickerCard fill={COLORS.card} offset={6}>
              <View className="flex-row items-center gap-12">
                <View style={{ flex: 1 }}>
                  <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>
                    {novaQuest.code}
                  </Mono>
                  <Display style={{ fontSize: 18, color: COLORS.white, marginTop: 2 }}>
                    {novaQuest.title}
                  </Display>
                  <Body style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
                    {novaQuest.blurb}
                  </Body>
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
                    +{novaQuest.xp}
                  </Mono>
                </View>
              </View>
            </StickerCard>
          </Pressable>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
