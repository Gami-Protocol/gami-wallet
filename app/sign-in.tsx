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
import { ChevronLeft } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { requestCode, verifyCode } from '@/lib/auth/session';
import { Body, Display, Mono, PrimaryButton, RadialBloom, StickerCard } from '@/components/sticker';

type Step = 'email' | 'code';

export default function SignInScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendCode = async () => {
    if (!emailValid || busy) return;
    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await requestCode(email);
    setBusy(false);
    if (res.ok) {
      setStep('code');
    } else {
      setError(res.error ?? 'Could not send code.');
    }
  };

  const verify = async () => {
    if (code.trim().length < 6 || busy) return;
    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await verifyCode(email, code);
    setBusy(false);
    if (res.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      setError(res.error ?? 'Invalid code.');
    }
  };

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
              onPress={() => (step === 'code' ? setStep('email') : router.back())}
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
            <Display style={{ fontSize: 18, color: COLORS.white }}>SIGN IN</Display>
            <View style={{ width: 36 }} />
          </View>

          <View style={{ marginTop: 24 }}>
            <Display style={{ fontSize: 28, color: COLORS.white, lineHeight: 32 }}>
              {step === 'email' ? 'Sync your\nprogress' : 'Enter the\n6-digit code'}
            </Display>
            <Body style={{ fontSize: 13, color: COLORS.muted, marginTop: 10 }}>
              {step === 'email'
                ? 'Your wallet stays on this device. An account just saves your quests, XP and NOVA history across devices.'
                : `We sent a code to ${email}. It expires shortly.`}
            </Body>
          </View>

          <View style={{ marginTop: 26, gap: 14 }}>
            {step === 'email' ? (
              <StickerCard fill={COLORS.card} offset={4} className="px-4 py-3">
                <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>EMAIL</Mono>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  inputMode="email"
                  onSubmitEditing={() => void sendCode()}
                  returnKeyType="send"
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    color: COLORS.white,
                    paddingVertical: 6,
                    padding: 0,
                    marginTop: 4,
                  }}
                />
              </StickerCard>
            ) : (
              <StickerCard fill={COLORS.card} offset={4} className="px-4 py-3">
                <Mono style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>CODE</Mono>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  onSubmitEditing={() => void verify()}
                  returnKeyType="done"
                  style={{
                    fontFamily: FONTS.monoBold,
                    fontSize: 28,
                    letterSpacing: 8,
                    color: COLORS.white,
                    paddingVertical: 6,
                    padding: 0,
                    marginTop: 4,
                  }}
                />
              </StickerCard>
            )}

            {error ? <Body style={{ fontSize: 12, color: COLORS.magenta }}>{error}</Body> : null}

            {step === 'email' ? (
              <PrimaryButton
                label={busy ? 'Sending…' : 'Send code'}
                color="lime"
                textColor={COLORS.black}
                disabled={!emailValid || busy}
                onPress={() => void sendCode()}
              />
            ) : (
              <View style={{ gap: 12 }}>
                <PrimaryButton
                  label={busy ? 'Verifying…' : 'Verify'}
                  color="lime"
                  textColor={COLORS.black}
                  disabled={code.trim().length < 6 || busy}
                  onPress={() => void verify()}
                />
                <Pressable onPress={() => void sendCode()} disabled={busy} hitSlop={8}>
                  <Mono
                    style={{
                      fontSize: 12,
                      color: COLORS.cyan,
                      textAlign: 'center',
                      fontFamily: FONTS.monoBold,
                    }}
                  >
                    RESEND CODE
                  </Mono>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RadialBloom>
  );
}
