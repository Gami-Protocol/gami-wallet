import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Bell } from 'lucide-react-native';

import { COLORS, FONTS } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import { fireEvent } from '@/lib/events';
import { useGameStore } from '@/lib/store/gameStore';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Body, Display, Mono, PrimaryButton, StickerCard } from '@/components/sticker';

const PREVIEWS = [
  { title: 'NOVA', body: 'gm. a fresh quest just dropped — wanna see?', color: COLORS.purple },
  { title: 'STREAK', body: '🔥 day 2 unlocked. +25 XP banked.', color: COLORS.yellow },
];

/**
 * 11 Permissions — "Stay in the loop." Big bell sticker with a notification
 * badge, preview toasts, enable CTA (or continue anyway).
 */
export default function Permissions() {
  const [busy, setBusy] = useState(false);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);

  const finish = () => {
    completeOnboarding();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(ROUTES.home);
  };

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === Notifications.PermissionStatus.GRANTED;
      setNotificationsEnabled(granted);
      await fireEvent(
        granted ? 'permissions.notifications.granted' : 'permissions.notifications.denied',
      );
    } catch {
      await fireEvent('permissions.notifications.denied');
    } finally {
      setBusy(false);
      finish();
    }
  };

  const later = async () => {
    setNotificationsEnabled(false);
    await fireEvent('permissions.notifications.denied', { reason: 'maybe_later' });
    finish();
  };

  return (
    <OnboardingScreen step={3} showBack>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Display style={{ fontSize: 32, color: COLORS.white, lineHeight: 36 }}>
            Stay in the{' '}
          </Display>
          <Display style={{ fontSize: 32, color: COLORS.yellow, lineHeight: 36 }}>loop.</Display>
        </View>
        <Body style={{ marginTop: 12, color: COLORS.muted, fontSize: 13, maxWidth: 300 }}>
          Quest drops, streak saves and NOVA alpha — only the good stuff.
        </Body>

        {/* Bell sticker with badge */}
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View>
            <StickerCard fill={COLORS.yellow} offset={6} rotate={-3} className="p-8">
              <Bell color={COLORS.black} size={72} />
            </StickerCard>
            <View
              style={{
                position: 'absolute',
                right: -10,
                top: -12,
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor: COLORS.magenta,
                borderWidth: 2,
                borderColor: COLORS.black,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mono style={{ fontSize: 15, color: COLORS.white, fontFamily: FONTS.monoBold }}>
                3
              </Mono>
            </View>
          </View>
        </View>

        {/* Preview toasts */}
        <View style={{ marginTop: 32, gap: 12 }}>
          {PREVIEWS.map((p) => (
            <StickerCard key={p.title} fill={COLORS.card} offset={4} className="px-4 py-3">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: p.color,
                    borderWidth: 2,
                    borderColor: COLORS.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell color={COLORS.black} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Mono
                    style={{
                      fontSize: 10,
                      color: p.color,
                      fontFamily: FONTS.monoBold,
                      letterSpacing: 1,
                    }}
                  >
                    {p.title}
                  </Mono>
                  <Body style={{ fontSize: 13, color: COLORS.white, marginTop: 2 }}>{p.body}</Body>
                </View>
              </View>
            </StickerCard>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <PrimaryButton
          label="Turn on notifications"
          color="purple"
          disabled={busy}
          onPress={enable}
        />
        <Pressable onPress={later} hitSlop={10} style={{ alignSelf: 'center', marginTop: 14 }}>
          <Mono style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONTS.monoBold }}>
            MAYBE LATER
          </Mono>
        </Pressable>
      </View>
    </OnboardingScreen>
  );
}
