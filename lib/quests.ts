import type { AccentColor } from '@/lib/theme';

/**
 * Static quest catalogue. Completion is derived from game-store state where
 * possible (handle set, interests chosen, etc.).
 */

export type QuestId = 'QUEST_001' | 'QUEST_002' | 'QUEST_003' | 'QUEST_004';

export type Quest = {
  id: QuestId;
  code: string;
  title: string;
  blurb: string;
  xp: number;
  accent: AccentColor;
  /** NOVA's recommended pick. */
  novaPick?: boolean;
};

export const QUESTS: Quest[] = [
  {
    id: 'QUEST_001',
    code: 'QUEST_001',
    title: 'First Steps',
    blurb: 'Set up your wallet and claim your starter pack.',
    xp: 250,
    accent: 'lime',
  },
  {
    id: 'QUEST_002',
    code: 'QUEST_002',
    title: 'Receive your first drop',
    blurb: 'Share your address and receive any amount on Base.',
    xp: 150,
    accent: 'cyan',
    novaPick: true,
  },
  {
    id: 'QUEST_003',
    code: 'QUEST_003',
    title: 'Send it',
    blurb: 'Make your first on-chain transfer from the Stash.',
    xp: 200,
    accent: 'magenta',
  },
  {
    id: 'QUEST_004',
    code: 'QUEST_004',
    title: 'Ask NOVA',
    blurb: 'Chat with NOVA and let it suggest your next move.',
    xp: 100,
    accent: 'purple',
  },
];

export const getQuest = (id: QuestId): Quest | undefined => QUESTS.find((q) => q.id === id);
