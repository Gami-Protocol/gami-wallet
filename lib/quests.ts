import type { AccentColor } from '@/lib/theme';
import type { ChainId } from '@/lib/wallet/chains';
import type { Database } from '@/lib/database.types';

/**
 * Quest model. Static seeds keep the app fully functional offline; remote
 * quests (from Supabase) layer on top once signed in. The shapes are unified so
 * the UI renders either source identically.
 */

export type QuestActionType = 'none' | 'visit' | 'receive' | 'send' | 'swap' | 'hold';
export type QuestOrigin = 'user' | 'business' | 'ai' | 'seed';
export type QuestScope = 'global' | 'personal';

export type Quest = {
  id: string;
  code: string;
  title: string;
  blurb: string;
  xp: number;
  accent: AccentColor;
  novaPick?: boolean;
  origin: QuestOrigin;
  scope: QuestScope;
  action: {
    type: QuestActionType;
    chain?: ChainId;
    address?: string;
    minAmount?: number;
  };
  /** True for built-in seeds (completion derived from local game state). */
  isSeed: boolean;
};

/** Built-in quests — always present, no network needed. */
export const SEED_QUESTS: Quest[] = [
  {
    id: 'QUEST_001',
    code: 'QUEST_001',
    title: 'First Steps',
    blurb: 'Set up your wallet and claim your starter pack.',
    xp: 250,
    accent: 'lime',
    origin: 'seed',
    scope: 'global',
    action: { type: 'none' },
    isSeed: true,
  },
  {
    id: 'QUEST_002',
    code: 'QUEST_002',
    title: 'Receive your first drop',
    blurb: 'Share your address and receive any amount on Base.',
    xp: 150,
    accent: 'cyan',
    novaPick: true,
    origin: 'seed',
    scope: 'global',
    action: { type: 'receive', chain: 'base' },
    isSeed: true,
  },
  {
    id: 'QUEST_003',
    code: 'QUEST_003',
    title: 'Send it',
    blurb: 'Make your first on-chain transfer from the Stash.',
    xp: 200,
    accent: 'magenta',
    origin: 'seed',
    scope: 'global',
    action: { type: 'send' },
    isSeed: true,
  },
  {
    id: 'QUEST_004',
    code: 'QUEST_004',
    title: 'Ask NOVA',
    blurb: 'Chat with NOVA and let it suggest your next move.',
    xp: 100,
    accent: 'purple',
    origin: 'seed',
    scope: 'global',
    action: { type: 'none' },
    isSeed: true,
  },
];

const ACCENTS: AccentColor[] = ['purple', 'magenta', 'lime', 'yellow', 'cyan'];
function toAccent(value: string): AccentColor {
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return (ACCENTS as string[]).includes(value) ? (value as AccentColor) : 'lime';
}

const ACTION_TYPES: QuestActionType[] = ['none', 'visit', 'receive', 'send', 'swap', 'hold'];
function toActionType(value: string): QuestActionType {
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return (ACTION_TYPES as string[]).includes(value) ? (value as QuestActionType) : 'none';
}

const CHAIN_IDS: ChainId[] = ['base', 'polygon', 'arbitrum', 'solana'];
function toChain(value: string | null): ChainId | undefined {
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return value && (CHAIN_IDS as string[]).includes(value) ? (value as ChainId) : undefined;
}

type QuestRow = Database['public']['Tables']['quests']['Row'];

/** Map a Supabase quest row into the unified Quest shape. */
export function fromRow(row: QuestRow): Quest {
  return {
    id: row.id,
    code: `Q-${row.id.slice(0, 4).toUpperCase()}`,
    title: row.title,
    blurb: row.blurb,
    xp: row.xp,
    accent: toAccent(row.accent),
    novaPick: row.nova_pick,
    origin: (['user', 'business', 'ai', 'seed'] as string[]).includes(row.origin)
      ? // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
        (row.origin as QuestOrigin)
      : 'user',
    scope: row.scope === 'global' ? 'global' : 'personal',
    action: {
      type: toActionType(row.action_type),
      chain: toChain(row.action_chain),
      address: row.action_address ?? undefined,
      minAmount: row.action_min_amount ?? undefined,
    },
    isSeed: false,
  };
}

export const ACTION_LABEL: Record<QuestActionType, string> = {
  none: 'In-app',
  visit: 'Visit',
  receive: 'Receive',
  send: 'Send',
  swap: 'Swap',
  hold: 'Hold',
};
