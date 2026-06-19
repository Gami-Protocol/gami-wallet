import { View } from 'react-native';

import { COLORS } from '@/lib/theme';
import { Body, Display, RadialBloom } from '@/components/sticker';

export default function StashScreen() {
  return (
    <RadialBloom>
      <View className="pt-safe-offset-6 flex-1 items-center justify-center px-6">
        <Display style={{ fontSize: 30, color: COLORS.white }}>STASH</Display>
        <Body style={{ marginTop: 8, color: COLORS.muted }}>Coming in a later build phase.</Body>
      </View>
    </RadialBloom>
  );
}
