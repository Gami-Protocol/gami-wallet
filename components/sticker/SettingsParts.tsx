import { type ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/lib/theme';
import { Body, Display, Mono, StickerCard } from '@/components/sticker';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Mono style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: 10 }}>
        {title}
      </Mono>
      <StickerCard fill={COLORS.card} offset={5} className="px-0 py-0">
        {children}
      </StickerCard>
    </View>
  );
}

export function SettingsRow({
  label,
  hint,
  trailing,
  onPress,
  last = false,
}: {
  label: string;
  hint?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <View
      className="flex-row items-center px-4 py-3"
      style={{
        gap: 12,
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: COLORS.black,
      }}
    >
      <View style={{ flex: 1 }}>
        <Body style={{ fontSize: 14, color: COLORS.white }}>{label}</Body>
        {hint ? (
          <Mono style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>{hint}</Mono>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export function SettingsSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(v);
      }}
      trackColor={{ false: COLORS.inkSoft, true: COLORS.lime }}
      thumbColor={COLORS.white}
      ios_backgroundColor={COLORS.inkSoft}
    />
  );
}

/** Inline segmented selector rendered as brutalist pills. */
export function SegmentedSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { readonly value: T; readonly label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row" style={{ gap: 6 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(opt.value);
            }}
            style={{
              backgroundColor: active ? COLORS.purple : COLORS.inkSoft,
              borderWidth: 2,
              borderColor: COLORS.black,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Mono
              style={{
                fontSize: 11,
                color: active ? COLORS.white : COLORS.muted,
                fontFamily: FONTS.monoBold,
              }}
            >
              {opt.label}
            </Mono>
          </Pressable>
        );
      })}
    </View>
  );
}

export { Display };
