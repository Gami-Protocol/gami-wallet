module.exports = ({ config }) => {
  const nativePlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  // react-native-maps renders Google Maps on Android, which requires an API key.
  // Provide it via the GOOGLE_MAPS_API_KEY env var (set as an EAS env var/secret).
  // When unset, no key is injected so the manifest stays valid (iOS uses Apple Maps).
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || undefined;

  // EAS sets EAS_PROJECT_ID automatically during builds. For native builds this
  // must be present; fail fast here rather than getting a cryptic TypeError later.
  const easProjectId = process.env.EAS_PROJECT_ID;
  if (!easProjectId && process.env.EXPO_PLATFORM === 'native') {
    throw new Error(
      'EAS_PROJECT_ID environment variable is not set. ' +
        'Add it as an EAS environment variable or run `eas init` to link the project.',
    );
  }

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
      ...(googleMapsApiKey ? { config: { googleMaps: { apiKey: googleMapsApiKey } } } : {}),
    },
    extra: {
      eas: {
        projectId: easProjectId,
      },
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
      'expo-notifications',
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
