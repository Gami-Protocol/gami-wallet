import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AccentColor } from '@/lib/theme';
import type { CharacterId } from '@/components/sticker/CharacterTile';

export type Persona = 'Hype' | 'Chill' | 'Pro';

export type GameState = {
  /** Whether onboarding (02-11) has fully completed. */
  onboarded: boolean;
  handle: string | null;
  character: CharacterId | null;
  characterColor: AccentColor | null;
  interests: string[];
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  /** Wallet has been generated + stored in SecureStore. */
  walletReady: boolean;
  /** Secret phrase has been backed up by the user. */
  backedUp: boolean;
  notificationsEnabled: boolean;
  persona: Persona;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Whether balances are hidden across the app. */
  hideBalances: boolean;
  /** IDs of completed quests. */
  completedQuests: string[];
};

export type GameActions = {
  setHandle: (handle: string) => void;
  setCharacter: (id: CharacterId, color: AccentColor) => void;
  setInterests: (interests: string[]) => void;
  grantXp: (amount: number) => void;
  earnBadge: (badge: string) => void;
  setWalletReady: (ready: boolean) => void;
  setBackedUp: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setPersona: (p: Persona) => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setHideBalances: (v: boolean) => void;
  completeQuest: (id: string) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

export const XP_PER_LEVEL = 500;

const INITIAL: GameState = {
  onboarded: false,
  handle: null,
  character: null,
  characterColor: null,
  interests: [],
  xp: 0,
  level: 1,
  streak: 1,
  badges: [],
  walletReady: false,
  backedUp: false,
  notificationsEnabled: false,
  persona: 'Hype',
  soundEnabled: true,
  hapticsEnabled: true,
  hideBalances: false,
  completedQuests: [],
};

function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      setHandle: (handle) => set({ handle }),
      setCharacter: (character, characterColor) => set({ character, characterColor }),
      setInterests: (interests) => set({ interests }),
      grantXp: (amount) =>
        set((s) => {
          const xp = s.xp + amount;
          return { xp, level: levelForXp(xp) };
        }),
      earnBadge: (badge) =>
        set((s) => (s.badges.includes(badge) ? s : { badges: [...s.badges, badge] })),
      setWalletReady: (walletReady) => set({ walletReady }),
      setBackedUp: (backedUp) => set({ backedUp }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setPersona: (persona) => set({ persona }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setHideBalances: (hideBalances) => set({ hideBalances }),
      completeQuest: (id) =>
        set((s) =>
          s.completedQuests.includes(id) ? s : { completedQuests: [...s.completedQuests, id] },
        ),
      completeOnboarding: () => set({ onboarded: true }),
      reset: () => {
        void get();
        set({ ...INITIAL });
      },
    }),
    {
      name: 'gami.game.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const xpProgress = (xp: number) => {
  const into = xp % XP_PER_LEVEL;
  return { into, total: XP_PER_LEVEL, ratio: into / XP_PER_LEVEL };
};
