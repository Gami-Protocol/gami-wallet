import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, X } from 'lucide-react-native';

import { ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { fireEvent } from '@/lib/events';
import { type ChainId, CHAIN_ORDER, CHAINS } from '@/lib/wallet/chains';
import { type FeeEstimate, estimateFee, sendNative } from '@/lib/wallet/balances';
import { authenticate } from '@/lib/wallet/auth';
import { useGameStore } from '@/lib/store/gameStore';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';

type Phase = 'form' | 'submitting' | 'done';

export default function SendScreen() {
  const completeQuest = useGameStore((s) => s.completeQuest);
  const grantXp = useGameStore((s) => s.grantXp);
  const [chain, setChain] = useState<ChainId>('base');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState<FeeEstimate | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const cfg = CHAINS[chain];

  useEffect(() => {
    let active = true;
    setFee(null);
    void estimateFee(chain).then((f) => {
      if (active) setFee(f);
    });
    return () => {
      active = false;
    };
  }, [chain]);

  const canSubmit =
    to.trim().length > 0 && Number(amount) >= 0 && amount.trim().length > 0 && phase === 'form';

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    if (fee?.exceedsCeiling) {
      setError(`Network fee (${fee.fee.toFixed(6)} ${cfg.symbol}) exceeds the safety limit.`);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fireEvent('wallet.send.submit', { chain, amount });
    const ok = await authenticate('Confirm this transaction');
    if (!ok) {
      await fireEvent('wallet.send.fail', { chain, reason: 'auth_cancelled' });
      return;
    }
    await fireEvent('wallet.send.confirm', { chain });
    setPhase('submitting');
    try {
      const result = await sendNative(chain, to.trim(), amount.trim());
      setHash(result.hash);
      setPhase('done');
      grantXp(200);
      completeQuest('QUEST_003');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transaction failed.';
      setError(msg);
      setPhase('form');
      await fireEvent('wallet.send.fail', { chain, reason: 'submit_error' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (phase === 'done') {
    return (
      <RadialBloom>
        <View className="pt-safe-offset-4 flex-1 items-center justify-center px-6">
          <StickerCard fill={COLORS.lime} offset={6} rotate={-2} className="items-center px-6 py-8">
            <Display style={{ fontSize: 26, color: COLORS.black }}>SENT!</Display>
            <Mono style={{ fontSize: 12, color: COLORS.black, marginTop: 8 }}>+200 XP</Mono>
          </StickerCard>
          <Mono style={{ fontSize: 11, color: COLORS.muted, marginTop: 20, textAlign: 'center' }}>
            {hash}
          </Mono>
          <View style={{ marginTop: 28, width: '100%' }}>
            <PrimaryButton label="Done" color="purple" onPress={() => router.back()} />
          </View>
        </View>
      </RadialBloom>
    );
  }

  return (
    <RadialBloom>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="pt-safe-offset-3 flex-1 px-5"
        >
          <View className="flex-row items-center justify-between py-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{
                width: 36,
                height: 36,
                backgroundColor: COLORS.card,
                borderWidth: 2,
                borderColor: COLORS.black,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft color={COLORS.white} size={20} />
            </Pressable>
            <Display style={{ fontSize: 18, color: COLORS.white }}>SEND</Display>
            <View style={{ width: 36 }} />
          </View>

          {/* Chain picker */}
          <Mono
            style={{
              fontSize: 10,
              color: COLORS.muted,
              letterSpacing: 1,
              marginTop: 14,
              marginBottom: 10,
            }}
          >
            CHAIN
          </Mono>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {CHAIN_ORDER.map((id) => {
              const c = CHAINS[id];
              const active = id === chain;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChain(id);
                  }}
                  style={{
                    backgroundColor: active ? ACCENT_HEX[c.accent] : COLORS.card,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Mono
                    style={{
                      fontSize: 12,
                      color: active ? COLORS.black : COLORS.white,
                      fontFamily: FONTS.monoBold,
                    }}
                  >
                    {c.label}
                  </Mono>
                </Pressable>
              );
            })}
          </View>

          {/* Recipient */}
          <Mono
            style={{
              fontSize: 10,
              color: COLORS.muted,
              letterSpacing: 1,
              marginTop: 22,
              marginBottom: 8,
            }}
          >
            RECIPIENT
          </Mono>
          <View
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder={cfg.kind === 'evm' ? '0x…' : 'Solana address'}
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.white, padding: 0 }}
            />
          </View>

          {/* Amount */}
          <Mono
            style={{
              fontSize: 10,
              color: COLORS.muted,
              letterSpacing: 1,
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            AMOUNT
          </Mono>
          <View
            className="flex-row items-center"
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 8,
            }}
          >
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                fontFamily: FONTS.monoBold,
                fontSize: 20,
                color: COLORS.white,
                padding: 0,
              }}
            />
            <Mono style={{ fontSize: 14, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
              {cfg.symbol}
            </Mono>
          </View>

          {/* Fee estimate */}
          <View style={{ marginTop: 18 }}>
            <StickerCard fill={COLORS.inkSoft} offset={4} className="px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Body style={{ fontSize: 13, color: COLORS.muted }}>Network fee (est.)</Body>
                {fee === null ? (
                  <ActivityIndicator color={COLORS.lime} size="small" />
                ) : (
                  <Mono
                    style={{
                      fontSize: 13,
                      color: fee.exceedsCeiling ? COLORS.magenta : COLORS.white,
                      fontFamily: FONTS.monoBold,
                    }}
                  >
                    {fee.fee.toFixed(6)} {cfg.symbol}
                  </Mono>
                )}
              </View>
              {fee?.exceedsCeiling && (
                <Mono style={{ fontSize: 10, color: COLORS.magenta, marginTop: 6 }}>
                  Above the {cfg.feeCeiling} {cfg.symbol} safety limit — send blocked.
                </Mono>
              )}
            </StickerCard>
          </View>

          {error && (
            <View
              className="flex-row items-center"
              style={{
                gap: 8,
                marginTop: 16,
                backgroundColor: COLORS.card,
                borderWidth: 2,
                borderColor: COLORS.magenta,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <X color={COLORS.magenta} size={16} />
              <Body style={{ flex: 1, fontSize: 12, color: COLORS.white }}>{error}</Body>
            </View>
          )}

          <View style={{ marginTop: 26 }}>
            <PrimaryButton
              label={phase === 'submitting' ? 'Submitting…' : 'Confirm with Face ID'}
              color="magenta"
              disabled={!canSubmit || Boolean(fee?.exceedsCeiling)}
              onPress={() => void submit()}
            />
          </View>
          <Body style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 12 }}>
            Sends the native {cfg.symbol} token on {cfg.label}.
          </Body>
        </ScrollView>
      </KeyboardAvoidingView>
    </RadialBloom>
  );
}
