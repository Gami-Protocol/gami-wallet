# GAMI Wallet

A non-custodial, gamified multi-chain crypto wallet for iOS and Android. Earn XP, complete quests, and interact with an AI assistant (NOVA) — all while keeping full custody of your keys.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Supported Chains](#supported-chains)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Architecture](#architecture)
  - [Wallet & Key Management](#wallet--key-management)
  - [Gamification](#gamification)
  - [NOVA AI Assistant](#nova-ai-assistant)
  - [Authentication & Backend](#authentication--backend)
- [Scripts](#scripts)
- [Linting & Formatting](#linting--formatting)
- [Building for Production](#building-for-production)

---

## Features

- **Non-custodial wallet** — 12-word BIP39 mnemonic generated on-device and stored exclusively in the OS secure enclave (Expo SecureStore). The mnemonic never leaves the device in plaintext.
- **Multi-chain** — supports Base, Polygon, Arbitrum (EVM via viem) and Solana (via @solana/web3.js) from a single seed phrase.
- **Gamification** — XP, levels, streaks, badges, and a quest system that rewards real on-chain actions.
- **NOVA AI assistant** — powered by Anthropic Claude (via a Supabase edge function). Suggests quests, summarises balances, and proposes (but never signs) sends. Works offline with a local responder.
- **Biometric security** — Face ID / fingerprint required to unlock the app, reveal the recovery phrase, and confirm sends. Configurable auto-lock timer.
- **Onboarding flow** — guided setup: handle, interests, wallet creation or import, vault backup, and starter quest.
- **Send & Receive** — on-chain transfers with a per-chain fee ceiling to protect users from runaway gas costs.
- **Stash** — multi-chain balance view with optional balance hiding.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 54) |
| Language | TypeScript 5.9 |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based, typed routes) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) with AsyncStorage persistence |
| EVM | [viem](https://viem.sh/) |
| Solana | [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) |
| HD wallet | [@scure/bip32](https://github.com/paulmillr/scure-bip32), [@scure/bip39](https://github.com/paulmillr/scure-bip39) |
| Secure storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Backend / Auth | [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security + Edge Functions) |
| UI components | [heroui-native](https://heroui.com/), [lucide-react-native](https://lucide.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) via [UniWind](https://github.com/marklawlor/nativewind) |
| Analytics | [PostHog](https://posthog.com/) |
| Linter | [oxlint](https://oxc.rs/docs/guide/usage/linter.html) |
| Formatter | [oxfmt](https://oxc.rs/) |

---

## Supported Chains

| Chain | Symbol | Derivation path | Fee ceiling |
|---|---|---|---|
| Base | ETH | m/44'/60'/0'/0/0 | 0.005 ETH |
| Polygon | POL | m/44'/60'/0'/0/0 | 0.5 POL |
| Arbitrum | ETH | m/44'/60'/0'/0/0 | 0.005 ETH |
| Solana | SOL | m/44'/501'/0'/0' | 0.01 SOL |

---

## Project Structure

```
gami-wallet/
├── app/                      # Expo Router screens (file-based routing)
│   ├── (app)/                # Authenticated main app screens
│   │   ├── home.tsx          # Home / dashboard
│   │   ├── nova.tsx          # NOVA AI chat
│   │   ├── quests.tsx        # Quest list
│   │   ├── stash.tsx         # Multi-chain balances
│   │   └── profile.tsx       # User profile & settings
│   ├── (onboarding)/         # Guided onboarding flow
│   │   ├── welcome.tsx
│   │   ├── handle.tsx
│   │   ├── interests.tsx
│   │   ├── create-wallet.tsx
│   │   ├── vault.tsx         # Backup phrase reveal & confirmation
│   │   ├── starter-pack.tsx
│   │   └── first-quest.tsx
│   ├── send.tsx              # Send flow (modal)
│   ├── receive.tsx           # Receive / QR code
│   ├── settings.tsx          # App settings
│   └── quest-builder.tsx     # AI quest builder
├── components/               # Shared UI components
│   ├── LockOverlay.tsx       # Biometric lock screen
│   ├── OnboardingScreen.tsx  # Onboarding layout wrapper
│   └── sticker/              # Character / sticker components
├── hooks/                    # Custom React hooks
│   ├── useAddresses.ts       # Resolved wallet addresses
│   └── useAsyncStorage.tsx   # AsyncStorage helper hook
├── lib/                      # Core business logic
│   ├── wallet/
│   │   ├── wallet.ts         # Mnemonic generation, import, derivation
│   │   ├── chains.ts         # Chain config (RPC, decimals, fee ceilings)
│   │   └── balances.ts       # Balance fetching
│   ├── store/
│   │   ├── gameStore.ts      # Zustand store: XP, level, quests, settings
│   │   ├── questStore.ts     # Remote quest fetching & caching
│   │   └── profileSync.ts    # Supabase profile sync
│   ├── auth/
│   │   └── session.ts        # Supabase auth helpers
│   ├── nova.ts               # NOVA streaming + local fallback
│   ├── quests.ts             # Quest model, seed quests, Supabase mapper
│   ├── supabase.ts           # Supabase client setup
│   ├── theme.ts              # Accent color tokens
│   ├── events.ts             # Analytics event helpers
│   ├── notifications.ts      # Push notification scheduling
│   └── utils.ts              # Shared utilities
├── app.config.ts             # Dynamic Expo config (env-based overrides)
├── global.css                # Global Tailwind/UniWind styles
├── babel.config.js
├── metro.config.cjs
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 10 — install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Expo Go** on your device ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) for quick previews
- **Xcode** (macOS only) or **Android Studio** for native builds

### Installation

```sh
git clone https://github.com/Gami-Protocol/gami-wallet.git
cd gami-wallet
npm install
```

### Environment Variables

Create a `.env.local` file in the project root (this file is git-ignored):

```env
# Supabase project URL (required for auth, quests, and NOVA)
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co

# Supabase anon / publishable key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

> **Note:** The wallet works fully offline without these variables — mnemonic generation, key derivation, and balance lookups all run locally. Supabase is only required for cloud-synced quests, NOVA AI responses, and cross-device authentication.

### Running the App

```sh
# Start the Expo dev server (opens in Expo Go via QR code)
npx expo start

# Or target a specific platform
npm run ios       # Requires Xcode + iOS Simulator
npm run android   # Requires Android Studio + emulator/device
```

---

## Architecture

### Wallet & Key Management

GAMI Wallet is fully **non-custodial**. The private key material never leaves the device:

1. A 12-word BIP39 mnemonic is generated using `@scure/bip39` with the standard English wordlist.
2. The mnemonic is stored in the OS-level secure enclave via `expo-secure-store` with the `WHEN_UNLOCKED_THIS_DEVICE_ONLY` access control flag. It is **never** written to AsyncStorage or any remote service.
3. EVM addresses are derived at `m/44'/60'/0'/0/0` via `viem/accounts`.
4. The Solana address is derived at `m/44'/501'/0'/0'` using `@scure/bip32` and base58-encoded in-app.
5. Reveals of the recovery phrase require a fresh biometric prompt at call time.

Key functions in `lib/wallet/wallet.ts`:

| Function | Description |
|---|---|
| `createWallet()` | Generates a new mnemonic, persists it, returns EVM + Solana addresses |
| `importWallet(mnemonic)` | Validates and imports an existing phrase |
| `getAddresses()` | Derives addresses from the stored mnemonic |
| `revealMnemonic()` | Returns the raw phrase — callers must gate behind Face ID |
| `wipeWallet()` | Deletes the mnemonic from SecureStore |

### Gamification

Game state (XP, level, streak, badges, completed quests) is managed by a Zustand store (`lib/store/gameStore.ts`) persisted to AsyncStorage.

- **XP** is granted by completing quests. Every 500 XP advances the player one level.
- **Quests** have an `action` field that maps to verifiable on-chain events (`receive`, `send`, `swap`, `hold`) or in-app actions (`none`, `visit`). Built-in seed quests are always available offline; remote quests are synced from Supabase.
- **Personas** (`Hype`, `Chill`, `Pro`) change NOVA's tone and UI copy throughout the app.

### NOVA AI Assistant

NOVA is an AI wallet assistant backed by Anthropic Claude (via a Supabase edge function). Its capabilities:

- Suggest the next best quest based on the user's progress
- Summarise on-chain balances
- Propose (but never execute) send transactions — the user always confirms with Face ID

Conversation history is persisted locally with a **30-day TTL** using AsyncStorage. When the backend is unreachable, a local persona-aware responder keeps NOVA functional offline.

**Tools emitted by NOVA:**

| Tool | Purpose |
|---|---|
| `suggest_quest` | Surfaces the most relevant quest |
| `generate_quest` | Creates a custom AI quest |
| `propose_send` | Proposes a send transaction for user confirmation |
| `get_balance` | Fetches the user's balance for display |

### Authentication & Backend

Authentication uses **email OTP only** (6-digit code) via Supabase Auth — no magic links, no OAuth redirects. The Supabase session scopes all backend data (quests, NOVA history, analytics events) through Row-Level Security. The on-device wallet is entirely independent of this session.

---

## Scripts

| Command | Description |
|---|---|
| `npm run ios` | Build and run on an iOS simulator |
| `npm run android` | Build and run on an Android emulator/device |
| `npm run lint` | Run oxlint with type-aware checks |
| `npm run lint:css` | Lint CSS / Tailwind class usage |
| `npm run format` | Auto-format all files with oxfmt |
| `npm run format:check` | Check formatting without writing changes |
| `npm run expo-check` | Verify Expo SDK dependency compatibility |

---

## Linting & Formatting

This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting (configured in `.oxlintrc.json`) and [oxfmt](https://oxc.rs/) for formatting (configured in `.oxfmtrc.json`).

```sh
# Lint
npm run lint
npm run lint:css

# Format check (CI)
npm run format:check

# Auto-format (local dev)
npm run format
```

---

## Building for Production

Production builds use [Expo Application Services (EAS)](https://expo.dev/eas).

```sh
# Install EAS CLI
npm install -g eas-cli

# Configure your project (first time only)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Bundle identifiers:
- **iOS:** `io.gamiprotocol.wallet`
- **Android:** `io.gamiprotocol.wallet`
