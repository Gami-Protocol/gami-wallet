import { View } from 'react-native';

import { COLORS } from '@/lib/theme';
import { Body, Display, RadialBloom } from '@/components/sticker';

function Placeholder({ title }: { title: string }) {
  return (
    <RadialBloom>
      <View className="pt-safe-offset-6 flex-1 items-center justify-center px-6">
        <Display style={{ fontSize: 30, color: COLORS.white }}>{title}</Display>
        <Body style={{ marginTop: 8, color: COLORS.muted }}>Coming in a later build phase.</Body>
      </View>
    </RadialBloom>
  );
}

export default function HomeScreen() {
  return <Placeholder title="HOME" />;
}
