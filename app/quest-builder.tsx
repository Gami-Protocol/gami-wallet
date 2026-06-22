import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Sparkles } from 'lucide-react-native';

import { ACCENT_HEX, type AccentColor, COLORS, FONTS } from '@/lib/theme';
import { type ChainId, CHAIN_ORDER, CHAINS } from '@/lib/wallet/chains';
import { type QuestActionType, ACTION_LABEL } from '@/lib/quests';
import { createQuest } from '@/lib/store/questStore';
import { generateQuests } from '@/lib/ai';
import { useSession } from '@/lib/auth/session';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';

type Mode = 'personal' | 'business';

const ACTION_TYPES: QuestActionType[] = ['none', 'visit', 'receive', 'send', 'swap', 'hold'];
const ACCENTS: AccentColor[] = ['lime', 'cyan', 'magenta', 'purple', 'yellow'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </Mono>
      {children}
    </View>
  );
}

function inputBox() {
  return {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 12,
    paddingVertical: 10,
  } as const;
}

export default function QuestBuilderScreen() {
  const { session } = useSession();
  const signedIn = Boolean(session);

  const [mode, setMode] = useState<Mode>('personal');
  const [title, setTitle] = useState('');
  const [blurb, setBlurb] = useState('');
  const [xp, setXp] = useState('150');
  const [accent, setAccent] = useState<AccentColor>('lime');
  const [actionType, setActionType] = useState<QuestActionType>('none');
  const [chain, setChain] = useState<ChainId>('base');
  const [address, setAddress] = useState('');
  const [minAmount, setMinAmount] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsChain = actionType !== 'none';
  const titleValid = title.trim().length >= 3;
  const xpNum = Math.max(0, Math.min(10000, parseInt(xp, 10) || 0));

  const runAi = async () => {
    if (!aiPrompt.trim() || aiBusy) return;
    setAiBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await generateQuests({ prompt: aiPrompt, mode, save: false, count: 1 });
    setAiBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const q = res.quests[0];
    if (!q) {
      setError('No quest came back. Try a different brief.');
      return;
    }
    // Pre-fill the form with the draft so the user can edit before saving.
    setTitle(q.title);
    setBlurb(q.blurb);
    setXp(String(q.xp));
    setAccent(q.accent);
    setActionType(q.action.type);
    if (q.action.chain) setChain(q.action.chain);
    if (q.action.address) setAddress(q.action.address);
    if (q.action.minAmount != null) setMinAmount(String(q.action.minAmount));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const save = async () => {
    if (!titleValid || saving) return;
    if (!signedIn) {
      router.push(ROUTES.signIn);
      return;
    }
    setSaving(true);
    setError(null);
    const created = await createQuest({
      title: title.trim(),
      blurb: blurb.trim(),
      xp: xpNum,
      accent,
      scope: mode === 'business' ? 'global' : 'personal',
      origin: mode === 'business' ? 'business' : 'user',
      actionType,
      actionChain: needsChain ? chain : null,
      actionAddress: needsChain && address.trim() ? address.trim() : null,
      actionMinAmount: needsChain && minAmount ? Number(minAmount) : null,
    });
    setSaving(false);
    if (!created) {
      setError('Could not save the quest. Check your connection and try again.');
      return;
    }
    void fireEvent('quest.created', { mode, action: actionType });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <RadialBloom>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
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
            <Display style={{ fontSize: 18, color: COLORS.white }}>NEW QUEST</Display>
            <View style={{ width: 36 }} />
          </View>

          {/* Mode toggle */}
          <View className="flex-row" style={{ gap: 10 }}>
            {(['personal', 'business'] as Mode[]).map((m) => {
              const active = m === mode;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setMode(m);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: active ? COLORS.purple : COLORS.card,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Mono
                    style={{
                      fontSize: 12,
                      color: COLORS.white,
                      fontFamily: FONTS.monoBold,
                      letterSpacing: 1,
                    }}
                  >
                    {m === 'personal' ? 'PERSONAL' : 'BUSINESS'}
                  </Mono>
                </Pressable>
              );
            })}
          </View>
          <Body style={{ fontSize: 11, color: COLORS.muted }}>
            {mode === 'personal'
              ? 'A private goal just for you.'
              : 'A public quest discoverable by everyone in GAMI.'}
          </Body>

          {/* AI assist */}
          <StickerCard fill={COLORS.inkSoft} offset={4}>
            <View className="flex-row items-center" style={{ gap: 8, marginBottom: 10 }}>
              <Sparkles color={COLORS.lime} size={16} />
              <Mono style={{ fontSize: 11, color: COLORS.lime, fontFamily: FONTS.monoBold }}>
                NOVA QUEST GENERATOR
              </Mono>
            </View>
            <View style={inputBox()}>
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder={
                  mode === 'business'
                    ? 'e.g. drive holders to receive our token on Base'
                    : 'e.g. learn to bridge and try a swap'
                }
                placeholderTextColor={COLORS.muted}
                multiline
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.white,
                  minHeight: 44,
                  padding: 0,
                }}
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <PrimaryButton
                label={aiBusy ? 'Thinking…' : 'Draft with NOVA'}
                color="cyan"
                textColor={COLORS.black}
                offset={4}
                disabled={!aiPrompt.trim() || aiBusy}
                leading={<Sparkles color={COLORS.black} size={16} />}
                onPress={() => void runAi()}
              />
            </View>
            {!signedIn ? (
              <Body style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
                Sign in to generate and save quests.
              </Body>
            ) : null}
          </StickerCard>

          {/* Manual fields */}
          <Field label="TITLE">
            <View style={inputBox()}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Quest title"
                placeholderTextColor={COLORS.muted}
                maxLength={120}
                style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.white, padding: 0 }}
              />
            </View>
          </Field>

          <Field label="DESCRIPTION">
            <View style={inputBox()}>
              <TextInput
                value={blurb}
                onChangeText={setBlurb}
                placeholder="What should the player do?"
                placeholderTextColor={COLORS.muted}
                multiline
                maxLength={400}
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.white,
                  minHeight: 52,
                  padding: 0,
                }}
              />
            </View>
          </Field>

          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ width: 110 }}>
              <Field label="XP REWARD">
                <View style={inputBox()}>
                  <TextInput
                    value={xp}
                    onChangeText={(t) => setXp(t.replace(/\D/g, '').slice(0, 5))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    style={{
                      fontFamily: FONTS.monoBold,
                      fontSize: 16,
                      color: COLORS.lime,
                      padding: 0,
                    }}
                  />
                </View>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="COLOR">
                <View className="flex-row" style={{ gap: 8, paddingTop: 4 }}>
                  {ACCENTS.map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setAccent(a);
                      }}
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: ACCENT_HEX[a],
                        borderWidth: accent === a ? 3 : 2,
                        borderColor: accent === a ? COLORS.white : COLORS.black,
                      }}
                    />
                  ))}
                </View>
              </Field>
            </View>
          </View>

          {/* On-chain action */}
          <Field label="ON-CHAIN ACTION">
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {ACTION_TYPES.map((t) => {
                const active = t === actionType;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setActionType(t);
                    }}
                    style={{
                      backgroundColor: active ? COLORS.lime : COLORS.card,
                      borderWidth: 2,
                      borderColor: COLORS.black,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Mono
                      style={{
                        fontSize: 11,
                        color: active ? COLORS.black : COLORS.white,
                        fontFamily: FONTS.monoBold,
                      }}
                    >
                      {ACTION_LABEL[t]}
                    </Mono>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {needsChain ? (
            <View style={{ gap: 14 }}>
              <Field label="CHAIN">
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {CHAIN_ORDER.map((id) => {
                    const c = CHAINS[id];
                    const active = id === chain;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setChain(id);
                        }}
                        style={{
                          backgroundColor: active ? ACCENT_HEX[c.accent] : COLORS.card,
                          borderWidth: 2,
                          borderColor: COLORS.black,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Mono
                          style={{
                            fontSize: 11,
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
              </Field>

              <Field label="TARGET ADDRESS / CONTRACT (OPTIONAL)">
                <View style={inputBox()}>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="0x… or contract address"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      fontFamily: FONTS.monoRegular,
                      fontSize: 13,
                      color: COLORS.white,
                      padding: 0,
                    }}
                  />
                </View>
              </Field>

              <Field label="MIN AMOUNT (OPTIONAL)">
                <View style={inputBox()}>
                  <TextInput
                    value={minAmount}
                    onChangeText={(t) => setMinAmount(t.replace(/[^0-9.]/g, ''))}
                    placeholder="0.0"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    style={{
                      fontFamily: FONTS.monoBold,
                      fontSize: 14,
                      color: COLORS.white,
                      padding: 0,
                    }}
                  />
                </View>
              </Field>
            </View>
          ) : null}

          {error ? <Body style={{ fontSize: 12, color: COLORS.magenta }}>{error}</Body> : null}

          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              label={saving ? 'Saving…' : signedIn ? 'Create quest' : 'Sign in to create'}
              color="magenta"
              disabled={!titleValid || saving}
              onPress={() => void save()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RadialBloom>
  );
}
