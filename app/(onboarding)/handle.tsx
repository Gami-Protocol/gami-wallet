import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Check, Loader } from 'lucide-react-native';

import { type AccentColor, ACCENT_HEX, COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { useGameStore } from '@/lib/store/gameStore';
import { CHARACTERS, type CharacterId } from '@/components/sticker/CharacterTile';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import {
  Body,
  CharacterTile,
  Display,
  Mono,
  PrimaryButton,
  ScribbleUnderline,
  StickerCard,
} from '@/components/sticker';

type Availability = 'idle' | 'checking' | 'available' | 'taken';

// A few reserved handles to demonstrate the "taken" state.
const RESERVED = new Set(['gami', 'admin', 'nova', 'satoshi', 'vitalik']);

const HANDLE_RE = /^[a-z0-9_]{3,15}$/;

/**
 * 06 Handle — "Pick your character." 6 character tiles + handle input with a
 * live availability check and mono helper text.
 */
export default function Handle() {
  const storeCharacter = useGameStore((s) => s.character);
  const storeHandle = useGameStore((s) => s.handle);
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setHandle = useGameStore((s) => s.setHandle);

  const [selected, setSelected] = useState<CharacterId | null>(storeCharacter);
  const [value, setValue] = useState(storeHandle ?? '');
  const [status, setStatus] = useState<Availability>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const valid = HANDLE_RE.test(value);

  // Debounced availability check.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!valid) {
      setStatus('idle');
      return () => {};
    }
    setStatus('checking');
    timer.current = setTimeout(() => {
      setStatus(RESERVED.has(value) ? 'taken' : 'available');
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, valid]);

  const selectCharacter = (id: CharacterId, color: AccentColor) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
    setCharacter(id, color);
  };

  const canContinue = selected !== null && status === 'available';

  const onContinue = async () => {
    if (!canContinue || selected === null) return;
    setHandle(value);
    await fireEvent('onboarding.character.selected', { character: selected });
    await fireEvent('onboarding.handle.claimed', { handle: value });
    router.push(ROUTES.nova);
  };

  const helper = useMemo(() => {
    if (!value) return 'lowercase letters, numbers, underscore · 3-15 chars';
    if (!valid) return 'use 3-15 lowercase letters, numbers or _';
    if (status === 'checking') return 'checking availability…';
    if (status === 'taken') return `✗ @${value} is taken · try another`;
    return `✓ available · saves to ${value}.gami`;
  }, [value, valid, status]);

  const helperColor =
    status === 'available'
      ? COLORS.lime
      : status === 'taken' || (!valid && value.length > 0)
        ? COLORS.magenta
        : COLORS.muted;

  return (
    <OnboardingScreen step={1} showBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>Pick your</Display>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Display style={{ fontSize: 32, color: COLORS.purple, lineHeight: 36 }}>
              character.
            </Display>
          </View>
          <View style={{ marginTop: 2, marginLeft: 2 }}>
            <ScribbleUnderline width={180} color={COLORS.purple} />
          </View>

          {/* Character grid */}
          <View
            style={{
              marginTop: 22,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 14,
              justifyContent: 'space-between',
            }}
          >
            {CHARACTERS.map((c) => {
              const isSel = selected === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => selectCharacter(c.id, c.color)}
                  style={{ width: '30%' }}
                >
                  <StickerCard
                    fill={isSel ? ACCENT_HEX[c.color] : COLORS.card}
                    offset={isSel ? 6 : 4}
                    className="items-center justify-center py-4"
                    style={{ opacity: isSel ? 1 : 0.92 }}
                  >
                    <CharacterTile id={c.id} color={c.color} size={48} selected={isSel} />
                    <Mono
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: isSel ? COLORS.black : COLORS.muted,
                        fontFamily: FONTS.monoBold,
                        letterSpacing: 1,
                      }}
                    >
                      {c.id}
                    </Mono>
                  </StickerCard>
                </Pressable>
              );
            })}
          </View>

          {/* Handle input */}
          <View style={{ marginTop: 26 }}>
            <Mono
              style={{
                fontSize: 10,
                color: COLORS.cyan,
                fontFamily: FONTS.monoBold,
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              ▸ YOUR HANDLE
            </Mono>
            <StickerCard fill={COLORS.inkSoft} offset={5} className="px-4 py-3">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Mono style={{ fontSize: 18, color: COLORS.muted, fontFamily: FONTS.monoBold }}>
                  @
                </Mono>
                <TextInput
                  value={value}
                  onChangeText={(t) => setValue(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="degen_01"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={15}
                  style={{
                    flex: 1,
                    fontFamily: FONTS.monoBold,
                    fontSize: 18,
                    color: COLORS.white,
                    padding: 0,
                  }}
                />
                {status === 'checking' && <Loader color={COLORS.muted} size={18} />}
                {status === 'available' && <Check color={COLORS.lime} size={20} />}
              </View>
            </StickerCard>
            <Mono
              style={{
                marginTop: 10,
                fontSize: 11,
                color: helperColor,
                fontFamily: FONTS.monoRegular,
              }}
            >
              {helper}
            </Mono>
          </View>
        </ScrollView>

        <View style={{ paddingTop: 8 }}>
          <PrimaryButton
            label="Continue"
            color="purple"
            disabled={!canContinue}
            onPress={onContinue}
          />
          {selected === null && (
            <Body
              style={{
                marginTop: 10,
                color: COLORS.muted,
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              Choose a character to continue.
            </Body>
          )}
        </View>
      </KeyboardAvoidingView>
    </OnboardingScreen>
  );
}
