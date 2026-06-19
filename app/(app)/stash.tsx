import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff } from 'lucide-react-native';

import { ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { CHAIN_ORDER, CHAINS } from '@/lib/wallet/chains';
import { type Balance, readAllBalances } from '@/lib/wallet/balances';
import { useGameStore } from '@/lib/store/gameStore';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';

function ChainRow({ balance, hidden }: { balance: Balance; hidden: boolean }) {
  const cfg = CHAINS[balance.chain];
  const accent = ACCENT_HEX[cfg.accent];
  const display = hidden ? '••••' : Number(balance.amount).toFixed(cfg.kind === 'evm' ? 5 : 4);
  return (
    <StickerCard fill={COLORS.card} offset={4} className="px-4 py-3">
      <View className="flex-row items-center gap-12">
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: accent,
            borderWidth: 2,
            borderColor: COLORS.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mono style={{ fontSize: 11, color: COLORS.black, fontFamily: FONTS.monoBold }}>
            {cfg.symbol.slice(0, 3)}
          </Mono>
        </View>
        <View style={{ flex: 1 }}>
          <Display style={{ fontSize: 15, color: COLORS.white }}>{cfg.label}</Display>
          <Mono style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>{cfg.symbol}</Mono>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Mono style={{ fontSize: 15, color: COLORS.white, fontFamily: FONTS.monoBold }}>
            {display}
          </Mono>
          <Mono style={{ fontSize: 10, color: COLORS.muted, marginTop: 1 }}>
            {hidden ? '••••' : '$0.00'}
          </Mono>
        </View>
      </View>
    </StickerCard>
  );
}

export default function StashScreen() {
  const hideBalances = useGameStore((s) => s.hideBalances);
  const setHideBalances = useGameStore((s) => s.setHideBalances);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await readAllBalances();
      setBalances(result);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ordered = CHAIN_ORDER.map(
    (id) =>
      balances.find((b) => b.chain === id) ?? {
        chain: id,
        symbol: CHAINS[id].symbol,
        amount: '0',
        value: 0,
      },
  );

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={COLORS.lime} />
        }
      >
        <View className="flex-row items-center justify-between py-3">
          <Display style={{ fontSize: 26, color: COLORS.white }}>STASH</Display>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHideBalances(!hideBalances);
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
            {hideBalances ? (
              <EyeOff color={COLORS.white} size={18} />
            ) : (
              <Eye color={COLORS.white} size={18} />
            )}
          </Pressable>
        </View>

        {/* Total card */}
        <StickerCard fill={COLORS.inkSoft} offset={6}>
          <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>TOTAL BALANCE</Mono>
          <Display style={{ fontSize: 34, color: COLORS.white, marginTop: 4 }}>
            {hideBalances ? '••••••' : '$0.00'}
          </Display>
          <View className="flex-row" style={{ gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Send"
                color="magenta"
                leading={<ArrowUpRight color={COLORS.white} size={18} />}
                onPress={() => router.push(ROUTES.send)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Receive"
                color="cyan"
                textColor={COLORS.black}
                leading={<ArrowDownLeft color={COLORS.black} size={18} />}
                onPress={() => router.push(ROUTES.receive)}
              />
            </View>
          </View>
        </StickerCard>

        <View style={{ marginTop: 22 }}>
          <Display style={{ fontSize: 16, color: COLORS.white, marginBottom: 12 }}>ASSETS</Display>
          <View style={{ gap: 10 }}>
            {ordered.map((b) => (
              <ChainRow key={b.chain} balance={b} hidden={hideBalances} />
            ))}
          </View>
          <Body style={{ fontSize: 11, color: COLORS.muted, marginTop: 14, textAlign: 'center' }}>
            Pull to refresh · live on-chain balances
          </Body>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
