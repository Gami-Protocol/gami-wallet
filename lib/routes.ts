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
  signIn: '/sign-in',
  questBuilder: '/quest-builder',
} as const;

/** Build a Send route prefilled from a NOVA propose_send proposal. */
export function sendProposalHref(p: { chain?: string; to?: string; amount?: string }): {
  pathname: '/send';
  params: Record<string, string>;
} {
  const params: Record<string, string> = {};
  if (p.chain) params.chain = p.chain;
  if (p.to) params.to = p.to;
  if (p.amount) params.amount = p.amount;
  return { pathname: '/send', params };
}
