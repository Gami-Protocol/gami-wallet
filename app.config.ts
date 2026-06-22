import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  return {
    ...config,
    name: 'GAMI Wallet',
    slug: 'gami-wallet',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'gami-wallet',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSFaceIDUsageDescription:
          'GAMI Wallet uses Face ID to unlock your wallet and reveal your secret backup phrase.',
      },
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'io.gamiprotocol.wallet',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'io.gamiprotocol.wallet',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'GAMI Wallet uses Face ID to unlock your wallet and reveal your backup phrase.',
        },
      ],
      // expo-notifications plugin is intentionally omitted: the app only uses
      // local scheduled notifications (no remote APNs push). Including the
      // plugin adds the aps-environment entitlement to the iOS build, which
      // causes archive failures when the provisioning profile does not have
      // Push Notifications capability enabled.
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
