import { Link } from 'expo-router';
import { View } from 'react-native';

import { COLORS } from '@/lib/theme';
import { Body, Display, RadialBloom } from '@/components/sticker';

export default function NotFoundScreen() {
  return (
    <RadialBloom>
      <View className="flex-1 items-center justify-center px-6" style={{ gap: 12 }}>
        <Display style={{ fontSize: 40, color: COLORS.magenta }}>404</Display>
        <Body style={{ color: COLORS.muted }}>This screen doesn&apos;t exist.</Body>
        <Link href="/">
          <Body style={{ color: COLORS.lime, fontFamily: 'JetBrainsMono_700Bold' }}>▸ GO HOME</Body>
        </Link>
      </View>
    </RadialBloom>
  );
}
