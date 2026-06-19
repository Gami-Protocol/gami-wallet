import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { ChevronLeft, Copy } from 'lucide-react-native';

import { ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { type ChainId, CHAIN_ORDER, CHAINS } from '@/lib/wallet/chains';
import { useAddresses } from '@/hooks/useAddresses';
import { Body, Display, Mono, RadialBloom, StickerCard } from '@/components/sticker';

export default function ReceiveScreen() {
  const addrs = useAddresses();
  const [chain, setChain] = useState<ChainId>('base');
  const [copied, setCopied] = useState(false);

  const cfg = CHAINS[chain];
  const address = !addrs ? '' : cfg.kind === 'evm' ? addrs.evm : addrs.solana;

  const copy = async () => {
    if (!address) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
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
          <Display style={{ fontSize: 18, color: COLORS.white }}>RECEIVE</Display>
          <View style={{ width: 36 }} />
        </View>

        {/* Chain picker */}
        <View className="flex-row flex-wrap" style={{ gap: 8, marginTop: 18 }}>
          {CHAIN_ORDER.map((id) => {
            const c = CHAINS[id];
            const active = id === chain;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChain(id);
                  setCopied(false);
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

        {/* QR card */}
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <StickerCard fill={COLORS.white} offset={6} className="items-center p-6">
            {address ? (
              <QRCode
                value={address}
                size={208}
                backgroundColor={COLORS.white}
                color={COLORS.black}
              />
            ) : (
              <View style={{ width: 208, height: 208 }} />
            )}
          </StickerCard>
        </View>

        {/* Address + copy */}
        <View style={{ marginTop: 28 }}>
          <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, marginBottom: 8 }}>
            {cfg.label.toUpperCase()} ADDRESS
          </Mono>
          <Pressable onPress={copy}>
            <StickerCard fill={COLORS.card} offset={4} className="px-4 py-4">
              <View className="flex-row items-center gap-12">
                <Mono style={{ flex: 1, fontSize: 13, color: COLORS.white }}>{address || '—'}</Mono>
                {copied ? (
                  <Mono style={{ fontSize: 11, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                    COPIED
                  </Mono>
                ) : (
                  <Copy color={COLORS.muted} size={18} />
                )}
              </View>
            </StickerCard>
          </Pressable>
          <Body style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 14 }}>
            Only send {cfg.symbol} and {cfg.kind === 'evm' ? 'EVM' : 'Solana'} assets to this
            address.
          </Body>
        </View>
      </ScrollView>
    </RadialBloom>
  );
}
