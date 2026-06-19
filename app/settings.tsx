import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Copy } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { shortAddr } from '@/lib/utils';
import { fireEvent } from '@/lib/events';
import { type Persona, useGameStore } from '@/lib/store/gameStore';
import { authenticate } from '@/lib/wallet/auth';
import { revealMnemonic, wipeWallet } from '@/lib/wallet/wallet';
import { clearVault } from '@/lib/wallet/auth';
import { useAddresses } from '@/hooks/useAddresses';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';
import {
  SegmentedSelect,
  SettingsRow,
  SettingsSection,
  SettingsSwitch,
} from '@/components/sticker/SettingsParts';

const AUTO_LOCK = [
  { value: '1', label: '1M' },
  { value: '5', label: '5M' },
  { value: '15', label: '15M' },
  { value: 'never', label: 'NEVER' },
] as const;

const REMINDER = [
  { value: '09:00', label: '9AM' },
  { value: '12:00', label: '12PM' },
  { value: '18:00', label: '6PM' },
  { value: 'off', label: 'OFF' },
] as const;

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'Hype', label: 'HYPE' },
  { value: 'Chill', label: 'CHILL' },
  { value: 'Pro', label: 'PRO' },
];

export default function SettingsScreen() {
  const handle = useGameStore((s) => s.handle);
  const persona = useGameStore((s) => s.persona);
  const setPersona = useGameStore((s) => s.setPersona);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useGameStore((s) => s.setHapticsEnabled);
  const hideBalances = useGameStore((s) => s.hideBalances);
  const setHideBalances = useGameStore((s) => s.setHideBalances);
  const backedUp = useGameStore((s) => s.backedUp);
  const setBackedUp = useGameStore((s) => s.setBackedUp);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  const reset = useGameStore((s) => s.reset);
  const addrs = useAddresses();

  const [faceId, setFaceId] = useState(true);
  const [autoLock, setAutoLock] = useState<string>('5');
  const [reminder, setReminder] = useState<string>('09:00');
  const [phrase, setPhrase] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const evm = addrs?.evm ?? null;

  useEffect(() => {
    if (!phrase) return undefined;
    const t = setTimeout(() => setPhrase(null), 30000);
    return () => clearTimeout(t);
  }, [phrase]);

  const copyAddress = async () => {
    if (!evm) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(evm);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1400);
  };

  const revealPhrase = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await authenticate('Unlock to reveal your recovery phrase');
    if (!ok) return;
    const m = await revealMnemonic();
    if (m) {
      setPhrase(m);
      setBackedUp(true);
    }
  };

  const signOut = () => {
    Alert.alert(
      'Sign out?',
      'This wipes your wallet and all local data from this device. Make sure your recovery phrase is backed up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await wipeWallet();
              await clearVault();
              reset();
              router.replace(ROUTES.welcome);
            })();
          },
        },
      ],
    );
  };

  return (
    <RadialBloom>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        className="pt-safe-offset-2 flex-1 px-5"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between py-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="flex-row items-center"
            style={{
              gap: 6,
              backgroundColor: COLORS.card,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <ChevronLeft color={COLORS.white} size={18} />
            <Mono style={{ fontSize: 12, color: COLORS.white, fontFamily: FONTS.monoBold }}>
              SETTINGS
            </Mono>
          </Pressable>
          <Mono style={{ fontSize: 11, color: COLORS.muted }}>v{version}</Mono>
        </View>

        {/* ACCOUNT */}
        <SettingsSection title="ACCOUNT">
          <SettingsRow label="Display name" hint={`@${handle ?? 'player'}`} />
          <SettingsRow label="Email" hint="Not connected" />
          <SettingsRow
            label="Wallet address"
            hint={shortAddr(evm)}
            last
            trailing={
              <Pressable onPress={copyAddress} hitSlop={10}>
                {copiedAddr ? (
                  <Mono style={{ fontSize: 10, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                    COPIED
                  </Mono>
                ) : (
                  <Copy color={COLORS.muted} size={18} />
                )}
              </Pressable>
            }
          />
        </SettingsSection>

        {/* SECURITY */}
        <SettingsSection title="SECURITY">
          <SettingsRow
            label="Face ID"
            hint="Unlock & confirm sends"
            trailing={<SettingsSwitch value={faceId} onChange={setFaceId} />}
          />
          <SettingsRow
            label="Auto-lock"
            trailing={
              <SegmentedSelect options={AUTO_LOCK} value={autoLock} onChange={setAutoLock} />
            }
          />
          <SettingsRow
            label="Backup phrase"
            hint={backedUp ? 'Backed up' : undefined}
            trailing={
              backedUp ? (
                <Pressable onPress={revealPhrase} hitSlop={8}>
                  <Mono style={{ fontSize: 11, color: COLORS.cyan, fontFamily: FONTS.monoBold }}>
                    REVEAL
                  </Mono>
                </Pressable>
              ) : (
                <Pressable
                  onPress={revealPhrase}
                  hitSlop={8}
                  style={{
                    backgroundColor: COLORS.magenta,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    transform: [{ rotate: '-3deg' }],
                  }}
                >
                  <Mono style={{ fontSize: 9, color: COLORS.white, fontFamily: FONTS.monoBold }}>
                    NOT BACKED UP
                  </Mono>
                </Pressable>
              )
            }
          />
          <SettingsRow
            label="Hide balances"
            last
            trailing={<SettingsSwitch value={hideBalances} onChange={setHideBalances} />}
          />
        </SettingsSection>

        {/* GAME */}
        <SettingsSection title="GAME">
          <SettingsRow
            label="Sound"
            trailing={<SettingsSwitch value={soundEnabled} onChange={setSoundEnabled} />}
          />
          <SettingsRow
            label="Haptics"
            trailing={<SettingsSwitch value={hapticsEnabled} onChange={setHapticsEnabled} />}
          />
          <SettingsRow
            label="Notifications"
            trailing={
              <SettingsSwitch
                value={notificationsEnabled}
                onChange={(v) => {
                  setNotificationsEnabled(v);
                  void fireEvent(
                    v ? 'permissions.notifications.granted' : 'permissions.notifications.denied',
                    { source: 'settings' },
                  );
                }}
              />
            }
          />
          <SettingsRow
            label="NOVA personality"
            trailing={
              <SegmentedSelect
                options={PERSONAS}
                value={persona}
                onChange={(p) => {
                  setPersona(p);
                  void fireEvent('nova.persona.set', { persona: p });
                }}
              />
            }
          />
          <SettingsRow
            label="Daily reminder"
            last
            trailing={
              <SegmentedSelect options={REMINDER} value={reminder} onChange={setReminder} />
            }
          />
        </SettingsSection>

        {/* Sign out */}
        <View style={{ marginTop: 28 }}>
          <Pressable onPress={signOut}>
            <View
              style={{
                borderWidth: 2,
                borderColor: COLORS.magenta,
                paddingVertical: 15,
                alignItems: 'center',
              }}
            >
              <Display style={{ fontSize: 15, color: COLORS.magenta, letterSpacing: 1 }}>
                SIGN OUT
              </Display>
            </View>
          </Pressable>
          <Body style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 10 }}>
            Wipes your wallet and all local data from this device.
          </Body>
        </View>
      </ScrollView>

      {/* Recovery phrase modal */}
      <Modal
        visible={phrase !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhrase(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(8,6,15,0.92)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <StickerCard fill={COLORS.card} offset={6}>
            <Display style={{ fontSize: 18, color: COLORS.white }}>Recovery phrase</Display>
            <Body style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
              Write these 12 words down in order. Never share them. Auto-hides in 30s.
            </Body>
            <View className="flex-row flex-wrap" style={{ gap: 8, marginTop: 16 }}>
              {(phrase ?? '')
                .split(' ')
                .map((word, i) => ({ word, pos: i + 1 }))
                .map(({ word, pos }) => (
                  <View
                    key={`word-${pos}`}
                    style={{
                      width: '30%',
                      backgroundColor: COLORS.inkSoft,
                      borderWidth: 2,
                      borderColor: COLORS.black,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                    }}
                  >
                    <Mono style={{ fontSize: 12, color: COLORS.white }}>
                      {pos}. {word}
                    </Mono>
                  </View>
                ))}
            </View>
            <View style={{ marginTop: 18 }}>
              <PrimaryButton
                label="Done"
                color="lime"
                textColor={COLORS.black}
                onPress={() => setPhrase(null)}
              />
            </View>
          </StickerCard>
        </View>
      </Modal>
    </RadialBloom>
  );
}
