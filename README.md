# GAMI Wallet

GAMI Wallet is a gamified self-custody mobile wallet built with Expo and React Native. It combines wallet onboarding, multi-chain asset flows, and quest-style progression into a playful mobile experience.

## Highlights

- On-device wallet creation with a 12-word recovery phrase
- Secure mnemonic storage with Expo SecureStore
- Face ID / device-auth gated sensitive actions
- Send and receive flows for Base, Polygon, Arbitrum, and Solana
- Live stash view with per-chain balances
- Gamified onboarding, quests, XP, badges, and streaks
- Customizable in-app persona and wallet preferences

## Tech stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- AsyncStorage
- Expo SecureStore
- viem
- `@solana/web3.js`

## Getting started

### Prerequisites

- Node.js
- npm
- Expo-compatible iOS simulator, Android emulator, or Expo Go

### Install dependencies

```sh
npm install
```

### Start the app

```sh
npx expo start
```

Then open the project in:

- Expo Go
- an iOS simulator
- an Android emulator
- a web browser

## Available scripts

```sh
npm run lint
npm run lint:css
npm run format
npm run format:check
```

## App experience

### Onboarding

The onboarding flow introduces the player identity, wallet setup, backup flow, permissions, interests, and first quests.

### Wallet

The wallet experience includes:

- multi-chain receive addresses
- native token sending with fee checks
- a stash screen for balances
- backup phrase reveal behind device authentication
- local sign-out that wipes wallet data from the device

### Game layer

GAMI Wallet layers progression on top of the wallet:

- XP and leveling
- quests
- badges
- streaks
- NOVA-guided moments and personality settings

## Supported chains

- Base
- Polygon
- Arbitrum
- Solana

## Project structure

```text
app/          Expo Router screens
components/   UI building blocks
hooks/        Shared React hooks
lib/          App state, wallet logic, theme, quests, and utilities
assets/       Static assets
scripts/      Repository scripts
```

## Security notes

- Recovery phrases are generated on device
- Wallet secrets are stored in SecureStore, not AsyncStorage
- Revealing the recovery phrase requires local authentication
- Signing out wipes wallet and local app data from the device

## Repository status

This repository currently includes linting and formatting scripts, but no dedicated automated test suite in `package.json`.
