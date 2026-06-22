# GAMI Wallet

A mobile crypto wallet for the GAMI Protocol ecosystem, built with React Native and Expo. Manage your Solana and EVM assets, complete quests, and interact with GAMI's AI companion Nova — all in one app.

## Features

- **Multi-chain support** — Solana and EVM wallets generated from a single seed phrase (BIP-39 / BIP-32)
- **Secure key storage** — private keys stored in the device's secure enclave via `expo-secure-store`
- **Biometric lock** — Face ID / fingerprint authentication via `expo-local-authentication`
- **Send & Receive** — transfer tokens with QR code generation and scanning
- **Quest system** — complete on-chain and off-chain quests to earn rewards
- **Nova AI** — an in-app AI assistant powered by the GAMI backend
- **Onboarding flow** — guided wallet creation with seed phrase backup (vault step)
- **Settings** — theme, security, and account management

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router (file-based) |
| Styling | Tailwind CSS via Uniwind, HeroUI Native |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Crypto | `@solana/web3.js`, `viem`, `@scure/bip32`, `@scure/bip39` |
| Auth / DB | Supabase |
| Analytics | PostHog |
| Storage | `expo-secure-store`, `@react-native-async-storage/async-storage` |

## Getting Started

### Prerequisites

- Node.js 18+ and npm 10+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or a simulator/emulator

### Installation

```sh
git clone https://github.com/Gami-Protocol/gami-wallet.git
cd gami-wallet
npm install
```

### Running the app

```sh
npx expo start
```

Scan the QR code in the terminal with Expo Go to launch on your device, or press `i` for iOS simulator / `a` for Android emulator.

To run natively (requires Xcode / Android Studio):

```sh
npm run ios      # iOS
npm run android  # Android
```

## Project Structure

```
app/
  (app)/          # Authenticated tab screens (Home, Stash, Quests, Profile, Nova)
  (onboarding)/   # Wallet creation / import flow
  send.tsx        # Send tokens modal
  receive.tsx     # Receive / QR code modal
  settings.tsx    # Settings screen
  sign-in.tsx     # Email OTP sign-in modal
  quest-builder.tsx

components/
  LockOverlay.tsx       # Biometric lock screen
  OnboardingScreen.tsx  # Shared onboarding wrapper

lib/
  wallet/         # Key generation, chain helpers, balance fetching
  auth/           # Authentication helpers
  store/          # Zustand stores (game, quests, profile)
  supabase.ts     # Supabase client
  nova.ts         # Nova AI helper
  quests.ts       # Quest logic
  events.ts       # Analytics event helpers
```

## Code Quality

```sh
npm run lint           # JS/TS linting (oxlint)
npm run lint:css       # CSS/Tailwind linting
npm run format:check   # Formatting check (oxfmt)
npm run format         # Auto-format
npm run expo-check     # Verify Expo dependency versions
```

## Environment Variables

The app uses Supabase for auth and data. Create a `.env` file (or set the variables in your CI environment):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional build-time overrides (used by the Bilt CI pipeline):

```env
BILT_APP_VERSION=1.0.0
BILT_IOS_BUNDLE_ID=io.gamiprotocol.wallet
BILT_ANDROID_PACKAGE=io.gamiprotocol.wallet
```

## Bundle IDs

| Platform | Identifier |
|---|---|
| iOS | `io.gamiprotocol.wallet` |
| Android | `io.gamiprotocol.wallet` |

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes and run `npm run lint` and `npm run format:check`.
3. Open a pull request against `main`.

## License

© GAMI Protocol. All rights reserved.
