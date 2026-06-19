/**
 * Centralized route hrefs for typed navigation. Avoids raw dynamic strings.
 */
export const ROUTES = {
  splash: '/',
  welcome: '/(onboarding)/welcome',
  auth: '/(onboarding)/auth',
  createWallet: '/(onboarding)/create-wallet',
  vault: '/(onboarding)/vault',
  handle: '/(onboarding)/handle',
  nova: '/(onboarding)/nova',
  interests: '/(onboarding)/interests',
  firstQuest: '/(onboarding)/first-quest',
  starterPack: '/(onboarding)/starter-pack',
  permissions: '/(onboarding)/permissions',
  home: '/(app)/home',
  quests: '/(app)/quests',
  novaTab: '/(app)/nova',
  stash: '/(app)/stash',
  profile: '/(app)/profile',
  settings: '/settings',
  send: '/send',
  receive: '/receive',
} as const;
