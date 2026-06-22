import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { ChevronLeft, ChevronRight, Copy, ExternalLink } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { shortAddr } from '@/lib/utils';
import { fireEvent } from '@/lib/events';
import {
  type AutoLock,
  type Persona,
  type ReminderTime,
  useGameStore,
} from '@/lib/store/gameStore';
import { syncDailyReminder } from '@/lib/notifications';
import {
  authenticate,
  biometricAvailable,
  clearVault,
  getVaultMode,
  setVaultMode,
  verifyPin,
} from '@/lib/wallet/auth';
import { revealMnemonic, wipeWallet } from '@/lib/wallet/wallet';
import { useAddresses } from '@/hooks/useAddresses';
import { clearMessages } from '@/lib/nova';
import { signOut as supabaseSignOut } from '@/lib/auth/session';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';
import {
  SegmentedSelect,
  SettingsRow,
  SettingsSection,
  SettingsSwitch,
} from '@/components/sticker/SettingsParts';

const AUTO_LOCK: { value: AutoLock; label: string }[] = [
  { value: '1', label: '1M' },
  { value: '5', label: '5M' },
  { value: '15', label: '15M' },
  { value: 'never', label: 'NEVER' },
];

const REMINDER: { value: ReminderTime; label: string }[] = [
  { value: '09:00', label: '9AM' },
  { value: '12:00', label: '12PM' },
  { value: '18:00', label: '6PM' },
  { value: 'off', label: 'OFF' },
];

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'Hype', label: 'HYPE' },
  { value: 'Chill', label: 'CHILL' },
  { value: 'Pro', label: 'PRO' },
];

const HANDLE_RE = /^[a-z0-9_]{3,16}$/;
const PIN_RE = /^\d{6}$/;
const SUPPORT_URL = 'https://discord.gg/9Y8vpDAhbD';

function clearNovaChat() {
  Alert.alert('Clear NOVA chat?', 'Removes your conversation history on this device.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Clear',
      style: 'destructive',
      onPress: () => {
        void clearMessages();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ]);
}

export default function SettingsScreen() {
  const handle = useGameStore((s) => s.handle);
  const setHandle = useGameStore((s) => s.setHandle);
  const email = useGameStore((s) => s.email);
  const setEmail = useGameStore((s) => s.setEmail);
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
  const faceIdEnabled = useGameStore((s) => s.faceIdEnabled);
  const setFaceIdEnabled = useGameStore((s) => s.setFaceIdEnabled);
  const autoLock = useGameStore((s) => s.autoLock);
  const setAutoLock = useGameStore((s) => s.setAutoLock);
  const reminder = useGameStore((s) => s.reminder);
  const setReminder = useGameStore((s) => s.setReminder);
  const reset = useGameStore((s) => s.reset);
  const addrs = useAddresses();

  const [phrase, setPhrase] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editEmail, setEditEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [pinModal, setPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [pinInput, setPinInput] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(true);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const evm = addrs?.evm ?? null;

  useEffect(() => {
    void (async () => {
      const mode = await getVaultMode();
      setHasPin(mode === 'pin');
      setBioAvailable(await biometricAvailable());
    })();
  }, []);

  useEffect(() => {
    if (!phrase) return undefined;
    const t = setTimeout(() => setPhrase(null), 30000);
    return () => clearTimeout(t);
  }, [phrase]);

  const nameValid = useMemo(() => HANDLE_RE.test(nameDraft.trim().toLowerCase()), [nameDraft]);
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim()),
    [emailDraft],
  );

  const copyAddress = async () => {
    if (!evm) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(evm);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1400);
  };

  const openEditName = () => {
    setNameDraft(handle ?? '');
    setEditName(true);
  };

  const saveName = () => {
    const next = nameDraft.trim().toLowerCase();
    if (!HANDLE_RE.test(next)) return;
    setHandle(next);
    void fireEvent('profile.handle.updated', { handle: next });
    setEditName(false);
  };

  const openEditEmail = () => {
    setEmailDraft(email ?? '');
    setEditEmail(true);
  };

  const saveEmail = () => {
    const next = emailDraft.trim();
    if (!emailValid) return;
    setEmail(next);
    void fireEvent('profile.email.updated', {});
    setEditEmail(false);
  };

  const toggleFaceId = async (v: boolean) => {
    if (v) {
      const available = await biometricAvailable();
      if (!available) {
        Alert.alert(
          'Biometrics unavailable',
          'No Face ID / fingerprint is enrolled on this device. Add one in your device settings, then try again.',
        );
        return;
      }
      const ok = await authenticate('Confirm to enable Face ID');
      if (!ok) return;
      await setVaultMode('biometric');
      setHasPin(false);
    } else {
      await setVaultMode('skip');
    }
    setFaceIdEnabled(v);
    void fireEvent('security.faceid.set', { enabled: v });
  };

  const changeAutoLock = (v: AutoLock) => {
    setAutoLock(v);
    void fireEvent('security.autolock.set', { value: v });
  };

  const changeReminder = (v: ReminderTime) => {
    setReminder(v);
    void (async () => {
      const ok = await syncDailyReminder(v);
      if (!ok && v !== 'off') {
        Alert.alert(
          'Notifications off',
          'Enable notifications for GAMI in your device settings to get daily reminders.',
        );
        setReminder('off');
        return;
      }
      void fireEvent('reminder.set', { value: v });
    })();
  };

  const revealPhrase = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await authenticate('Unlock to reveal your recovery phrase');
    if (!ok) return;
    const m = await revealMnemonic();
    if (m) {
      setPhrase(m);
      setBackedUp(true);
      void fireEvent('security.phrase.revealed', {});
    }
  };

  const openPinModal = () => {
    setPinInput('');
    setPinNew('');
    setPinStep(hasPin ? 'current' : 'new');
    setPinModal(true);
  };

  const submitPinStep = async () => {
    if (!PIN_RE.test(pinInput)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pinStep === 'current') {
      const ok = await verifyPin(pinInput);
      if (!ok) {
        Alert.alert('Wrong PIN', 'That PIN does not match. Try again.');
        setPinInput('');
        return;
      }
      setPinInput('');
      setPinStep('new');
      return;
    }
    if (pinStep === 'new') {
      setPinNew(pinInput);
      setPinInput('');
      setPinStep('confirm');
      return;
    }
    // confirm
    if (pinInput !== pinNew) {
      Alert.alert('PINs do not match', 'Re-enter your new 6-digit PIN.');
      setPinInput('');
      setPinStep('new');
      setPinNew('');
      return;
    }
    await setVaultMode('pin', pinNew);
    setHasPin(true);
    setFaceIdEnabled(false);
    void fireEvent('security.pin.set', {});
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPinModal(false);
  };

  const clearNova = () => clearNovaChat();

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
              await syncDailyReminder('off');
              await clearMessages();
              await supabaseSignOut();
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

  const pinTitle =
    pinStep === 'current'
      ? 'Enter current PIN'
      : pinStep === 'new'
        ? hasPin
          ? 'Enter new PIN'
          : 'Set a 6-digit PIN'
        : 'Confirm new PIN';

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
          <SettingsRow
            label="Display name"
            hint={`@${handle ?? 'player'}`}
            onPress={openEditName}
            trailing={<ChevronRight color={COLORS.muted} size={18} />}
          />
          <SettingsRow
            label="Email"
            hint={email ?? 'Not connected'}
            onPress={openEditEmail}
            trailing={<ChevronRight color={COLORS.muted} size={18} />}
          />
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
            hint={bioAvailable ? 'Unlock & confirm sends' : 'Not available on this device'}
            trailing={
              <SettingsSwitch value={faceIdEnabled} onChange={(v) => void toggleFaceId(v)} />
            }
          />
          <SettingsRow
            label="PIN"
            hint={hasPin ? 'Set — tap to change' : 'Not set'}
            onPress={openPinModal}
            trailing={<ChevronRight color={COLORS.muted} size={18} />}
          />
          <SettingsRow
            label="Auto-lock"
            trailing={
              <SegmentedSelect options={AUTO_LOCK} value={autoLock} onChange={changeAutoLock} />
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
                  if (!v) {
                    setReminder('off');
                    void syncDailyReminder('off');
                  }
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
              <SegmentedSelect options={REMINDER} value={reminder} onChange={changeReminder} />
            }
          />
        </SettingsSection>

        {/* DATA & SUPPORT */}
        <SettingsSection title="DATA & SUPPORT">
          <SettingsRow
            label="Clear NOVA chat"
            hint="Wipe conversation history"
            onPress={clearNova}
            trailing={<ChevronRight color={COLORS.muted} size={18} />}
          />
          <SettingsRow
            label="Help & community"
            hint="Discord"
            last
            onPress={() => void Linking.openURL(SUPPORT_URL)}
            trailing={<ExternalLink color={COLORS.muted} size={18} />}
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

      {/* Edit display name */}
      <EditModal
        visible={editName}
        title="Display name"
        subtitle="3–16 chars, lowercase letters, numbers, underscores."
        prefix="@"
        value={nameDraft}
        onChangeText={(t) => setNameDraft(t.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16))}
        autoCapitalize="none"
        valid={nameValid}
        onCancel={() => setEditName(false)}
        onSave={saveName}
      />

      {/* Edit email */}
      <EditModal
        visible={editEmail}
        title="Email"
        subtitle="Used for account recovery notices. Your wallet stays on-device."
        value={emailDraft}
        onChangeText={setEmailDraft}
        keyboardType="email-address"
        autoCapitalize="none"
        valid={emailValid}
        onCancel={() => setEditEmail(false)}
        onSave={saveEmail}
      />

      {/* PIN modal */}
      <Modal
        visible={pinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(8,6,15,0.92)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <StickerCard fill={COLORS.card} offset={6}>
            <Display style={{ fontSize: 18, color: COLORS.white }}>{pinTitle}</Display>
            <Body style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
              A PIN protects sensitive actions if Face ID is unavailable.
            </Body>
            <TextInput
              value={pinInput}
              onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
              placeholder="••••••"
              placeholderTextColor={COLORS.muted}
              style={{
                marginTop: 16,
                backgroundColor: COLORS.inkSoft,
                borderWidth: 2,
                borderColor: COLORS.black,
                color: COLORS.white,
                fontFamily: FONTS.monoBold,
                fontSize: 22,
                letterSpacing: 8,
                textAlign: 'center',
                paddingVertical: 12,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Cancel" color="purple" onPress={() => setPinModal(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={pinStep === 'confirm' ? 'Save' : 'Next'}
                  color="lime"
                  textColor={COLORS.black}
                  disabled={!PIN_RE.test(pinInput)}
                  onPress={() => void submitPinStep()}
                />
              </View>
            </View>
          </StickerCard>
        </KeyboardAvoidingView>
      </Modal>

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

function EditModal({
  visible,
  title,
  subtitle,
  prefix,
  value,
  onChangeText,
  valid,
  onCancel,
  onSave,
  keyboardType,
  autoCapitalize,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  prefix?: string;
  value: string;
  onChangeText: (t: string) => void;
  valid: boolean;
  onCancel: () => void;
  onSave: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(8,6,15,0.92)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <StickerCard fill={COLORS.card} offset={6}>
          <Display style={{ fontSize: 18, color: COLORS.white }}>{title}</Display>
          <Body style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>{subtitle}</Body>
          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.inkSoft,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 12,
            }}
          >
            {prefix ? (
              <Mono style={{ fontSize: 16, color: COLORS.muted, fontFamily: FONTS.monoBold }}>
                {prefix}
              </Mono>
            ) : null}
            <TextInput
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType ?? 'default'}
              autoCapitalize={autoCapitalize ?? 'sentences'}
              autoCorrect={false}
              autoFocus
              style={{
                flex: 1,
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 16,
                paddingVertical: 12,
                paddingLeft: prefix ? 2 : 0,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Cancel" color="purple" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Save"
                color="lime"
                textColor={COLORS.black}
                disabled={!valid}
                onPress={onSave}
              />
            </View>
          </View>
        </StickerCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}
