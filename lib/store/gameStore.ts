import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AccentColor } from '@/lib/theme';
import type { CharacterId } from '@/components/sticker/CharacterTile';

export type Persona = 'Hype' | 'Chill' | 'Pro';

/** Minutes of inactivity before the app re-locks. 'never' disables auto-lock. */
export type AutoLock = '1' | '5' | '15' | 'never';

/** Daily reminder time in 24h HH:mm, or 'off'. */
export type ReminderTime = '09:00' | '12:00' | '18:00' | 'off';

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
  /** Face ID / biometric unlock + send confirmation enabled. */
  faceIdEnabled: boolean;
  /** Inactivity window before the app re-locks. */
  autoLock: AutoLock;
  /** Daily quest reminder time (or off). */
  reminder: ReminderTime;
  /** Optional email connected to the account (display only; auth is on-device). */
  email: string | null;
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
  setFaceIdEnabled: (v: boolean) => void;
  setAutoLock: (v: AutoLock) => void;
  setReminder: (v: ReminderTime) => void;
  setEmail: (v: string | null) => void;
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
  faceIdEnabled: true,
  autoLock: '5',
  reminder: '09:00',
  email: null,
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
      setFaceIdEnabled: (faceIdEnabled) => set({ faceIdEnabled }),
      setAutoLock: (autoLock) => set({ autoLock }),
      setReminder: (reminder) => set({ reminder }),
      setEmail: (email) => set({ email }),
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
