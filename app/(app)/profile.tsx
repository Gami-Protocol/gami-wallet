import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Wallet as WalletIcon,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { shortAddr } from '@/lib/utils';
import { useGameStore, xpProgress } from '@/lib/store/gameStore';
import { useAddresses } from '@/hooks/useAddresses';
import { Body, CharacterTile, Display, Mono, RadialBloom, StickerCard } from '@/components/sticker';

const TOTAL_BADGES = 24;

type AccountRow = {
  key: string;
  label: string;
  icon: typeof Shield;
  isNew?: boolean;
  onPress: () => void;
};

function StatBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <Mono style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </Mono>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const handle = useGameStore((s) => s.handle);
  const character = useGameStore((s) => s.character);
  const characterColor = useGameStore((s) => s.characterColor);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const badges = useGameStore((s) => s.badges);
  const backedUp = useGameStore((s) => s.backedUp);
  const addrs = useAddresses();
  const [copied, setCopied] = useState(false);

  const { into, total, ratio } = xpProgress(xp);
  const evm = addrs?.evm ?? null;

  const copyAddress = async () => {
    if (!evm) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(evm);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const accountRows: AccountRow[] = [
    {
      key: 'security',
      label: 'Security & backup',
      icon: Shield,
      isNew: !backedUp,
      onPress: () => router.push(ROUTES.settings),
    },
    {
      key: 'wallets',
      label: 'Connected wallets',
      icon: WalletIcon,
      onPress: () => router.push(ROUTES.stash),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onPress: () => router.push(ROUTES.settings),
    },
    {
      key: 'nova',
      label: 'NOVA settings',
      icon: Sparkles,
      onPress: () => router.push(ROUTES.settings),
    },
    {
      key: 'help',
      label: 'Help & support',
      icon: HelpCircle,
      onPress: () => router.push(ROUTES.settings),
    },
  ];

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between py-3">
          <Display style={{ fontSize: 24, color: COLORS.white }}>PROFILE</Display>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(ROUTES.settings);
            }}
            hitSlop={12}
            style={{
              width: 38,
              height: 38,
              backgroundColor: COLORS.card,
              borderWidth: 2,
              borderColor: COLORS.black,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon color={COLORS.white} size={20} />
          </Pressable>
        </View>

        {/* Identity card */}
        <View style={{ marginTop: 8 }}>
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
            <View className="flex-row items-center gap-12">
              <CharacterTile id={character ?? 'NX'} color={characterColor ?? 'purple'} size={56} />
              <View style={{ flex: 1 }}>
                <Display style={{ fontSize: 22, color: COLORS.white }}>
                  @{handle ?? 'player'}
                </Display>
                <Pressable onPress={copyAddress} hitSlop={8}>
                  <Mono style={{ fontSize: 11, color: COLORS.white, opacity: 0.85, marginTop: 2 }}>
                    {handle ?? 'player'}.gami · {shortAddr(evm)}
                  </Mono>
                </Pressable>
              </View>
            </View>

            <View className="flex-row gap-2" style={{ marginTop: 14 }}>
              <View
                style={{
                  backgroundColor: COLORS.yellow,
                  borderWidth: 2,
                  borderColor: COLORS.black,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Mono style={{ fontSize: 10, color: COLORS.black, fontFamily: FONTS.monoBold }}>
                  {'\u25b6'} {streak} DAY
                </Mono>
              </View>
              {badges.includes('STARTER') && (
                <View
                  style={{
                    backgroundColor: COLORS.lime,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Mono style={{ fontSize: 10, color: COLORS.black, fontFamily: FONTS.monoBold }}>
                    STARTER
                  </Mono>
                </View>
              )}
              {copied && (
                <View
                  style={{
                    backgroundColor: COLORS.cyan,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Mono style={{ fontSize: 10, color: COLORS.black, fontFamily: FONTS.monoBold }}>
                    COPIED
                  </Mono>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Stat row */}
        <View style={{ marginTop: 18 }}>
          <StickerCard fill={COLORS.card} offset={5}>
            <View className="flex-row" style={{ gap: 16 }}>
              <StatBlock label="LEVEL">
                <Display style={{ fontSize: 22, color: COLORS.white }}>{level}</Display>
                <View
                  style={{
                    marginTop: 6,
                    height: 8,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    backgroundColor: COLORS.ink,
                    flexDirection: 'row',
                  }}
                >
                  <View
                    style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: COLORS.lime }}
                  />
                </View>
                <Mono style={{ fontSize: 9, color: COLORS.muted, marginTop: 4 }}>
                  {into}/{total}
                </Mono>
              </StatBlock>
              <View style={{ width: 2, backgroundColor: COLORS.black }} />
              <StatBlock label="BALANCE">
                <Display style={{ fontSize: 22, color: COLORS.white }}>$0.00</Display>
                <Mono style={{ fontSize: 10, color: COLORS.lime, marginTop: 8 }}>+0.0%</Mono>
              </StatBlock>
              <View style={{ width: 2, backgroundColor: COLORS.black }} />
              <StatBlock label="RANK">
                <Display style={{ fontSize: 22, color: COLORS.white }}>#—</Display>
                <Mono style={{ fontSize: 10, color: COLORS.muted, marginTop: 8 }}>leaderboard</Mono>
              </StatBlock>
            </View>
          </StickerCard>
        </View>

        {/* Badges strip */}
        <View style={{ marginTop: 22 }}>
          <View className="flex-row items-center gap-2" style={{ marginBottom: 12 }}>
            <Display style={{ fontSize: 16, color: COLORS.white }}>BADGES</Display>
            <Mono style={{ fontSize: 12, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
              · {badges.length}/{TOTAL_BADGES}
            </Mono>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          >
            {Array.from({ length: TOTAL_BADGES }, (_, i) => i).map((i) => {
              const earned = i === 0 && badges.includes('STARTER');
              return (
                <View
                  key={`badge-${i}`}
                  style={{
                    width: 66,
                    height: 66,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    backgroundColor: earned ? COLORS.yellow : COLORS.inkSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: earned ? 1 : 0.45,
                  }}
                >
                  {earned ? (
                    <Display style={{ fontSize: 11, color: COLORS.black, textAlign: 'center' }}>
                      STAR{'\n'}TER
                    </Display>
                  ) : (
                    <Mono style={{ fontSize: 18, color: COLORS.muted }}>?</Mono>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Account rows */}
        <View style={{ marginTop: 24 }}>
          <Display style={{ fontSize: 16, color: COLORS.white, marginBottom: 12 }}>ACCOUNT</Display>
          <View style={{ gap: 10 }}>
            {accountRows.map((row) => {
              const Icon = row.icon;
              return (
                <Pressable
                  key={row.key}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    row.onPress();
                  }}
                >
                  <StickerCard fill={COLORS.card} offset={4} className="px-4 py-3">
                    <View className="flex-row items-center gap-12">
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          backgroundColor: COLORS.inkSoft,
                          borderWidth: 2,
                          borderColor: COLORS.black,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon color={COLORS.white} size={18} />
                      </View>
                      <Body style={{ flex: 1, fontSize: 14, color: COLORS.white }}>
                        {row.label}
                      </Body>
                      {row.isNew && (
                        <View
                          style={{
                            backgroundColor: COLORS.magenta,
                            borderWidth: 2,
                            borderColor: COLORS.black,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            transform: [{ rotate: '-3deg' }],
                          }}
                        >
                          <Mono
                            style={{ fontSize: 9, color: COLORS.white, fontFamily: FONTS.monoBold }}
                          >
                            NEW
                          </Mono>
                        </View>
                      )}
                      <ChevronRight color={COLORS.muted} size={18} />
                    </View>
                  </StickerCard>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
