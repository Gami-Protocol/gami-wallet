import { type ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '@/lib/theme';

type RadialBloomProps = {
  children?: ReactNode;
};

/**
 * The app's base backdrop: #08060F with a soft purple bloom top-left and a
 * magenta bloom bottom-right, approximated with two oversized radial gradients.
 */
export function RadialBloom({ children }: RadialBloomProps) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
      {/* purple top-left */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(110,60,251,0.45)', 'rgba(110,60,251,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.7 }}
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 999,
        }}
      />
      {/* magenta bottom-right */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,61,154,0)', 'rgba(255,61,154,0.4)']}
        start={{ x: 0.2, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          bottom: -140,
          right: -120,
          width: 440,
          height: 440,
          borderRadius: 999,
        }}
      />
      {children}
    </View>
  );
}
