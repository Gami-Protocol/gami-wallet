import { useCallback, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { type Quest, SEED_QUESTS, fromRow } from '@/lib/quests';
import { readAllBalances } from '@/lib/wallet/balances';
import { useSession } from '@/lib/auth/session';

/**
 * Remote quest data. Seeds always render; remote quests (global + the signed-in
 * user's personal/business quests) are merged on top. Completions come from the
 * quest_completions table (remote) plus local game state (seeds).
 */

export type QuestData = {
  quests: Quest[];
  completedIds: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useQuests(): QuestData {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [remote, setRemote] = useState<Quest[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setRemote([]);
      setCompletedIds([]);
      return;
    }
    setLoading(true);
    try {
      const [{ data: questRows }, { data: completions }] = await Promise.all([
        supabase
          .from('quests')
          .select('*')
          .eq('active', true)
          // Seed quests render from the local SEED_QUESTS catalogue (so the app
          // works offline); exclude the DB copies to avoid duplicates.
          .neq('origin', 'seed')
          .order('created_at', { ascending: false }),
        supabase.from('quest_completions').select('quest_id'),
      ]);
      setRemote((questRows ?? []).map(fromRow));
      setCompletedIds((completions ?? []).map((c) => c.quest_id));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Seeds first (stable order), then remote quests not duplicating seeds.
  const quests = [...SEED_QUESTS, ...remote];

  return { quests, completedIds, loading, refresh };
}

export type CompleteResult = {
  awarded: number;
  newXp: number;
  newLevel: number;
};

/** Record a remote quest completion + award XP atomically via RPC. */
export async function completeRemoteQuest(
  questId: string,
  txHash?: string,
): Promise<CompleteResult | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('complete_quest', {
    p_quest_id: questId,
    p_tx_hash: txHash,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { awarded: row.awarded, newXp: row.new_xp, newLevel: row.new_level };
}

export type NewQuestInput = {
  title: string;
  blurb: string;
  xp: number;
  accent: string;
  scope: 'global' | 'personal';
  origin: 'user' | 'business';
  actionType: string;
  actionChain?: string | null;
  actionAddress?: string | null;
  actionMinAmount?: number | null;
};

/** Insert a manually-built quest under the caller's RLS context. */
export async function createQuest(input: NewQuestInput): Promise<Quest | null> {
  if (!isSupabaseConfigured) return null;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('quests')
    .insert({
      creator_id: uid,
      title: input.title,
      blurb: input.blurb,
      xp: input.xp,
      accent: input.accent,
      scope: input.scope,
      origin: input.origin,
      action_type: input.actionType,
      action_chain: input.actionChain ?? null,
      action_address: input.actionAddress ?? null,
      action_min_amount: input.actionMinAmount ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data);
}

export type VerifyResult = {
  ok: boolean;
  /** Reason shown to the user when verification fails. */
  reason?: string;
};

/**
 * Verify an on-chain quest's completion condition.
 *
 * - receive / hold: requires the chain's live balance to meet the min amount
 *   (defaults to any non-zero balance when no minimum is set).
 * - send / swap: verified at action time via the returned tx hash, so this
 *   returns ok and the caller passes the hash to completeRemoteQuest.
 * - visit / none: no on-chain check; treated as a manual confirmation.
 */
export async function verifyQuest(quest: Quest): Promise<VerifyResult> {
  const { type, chain, minAmount } = quest.action;
  if (type === 'receive' || type === 'hold') {
    if (!chain) return { ok: true };
    const balances = await readAllBalances();
    const b = balances.find((x) => x.chain === chain);
    const value = b ? b.value : 0;
    const min = minAmount ?? 0;
    if (value > min || (min === 0 && value > 0)) return { ok: true };
    return {
      ok: false,
      reason:
        min > 0
          ? `Hold at least ${min} on ${chain} to complete this quest.`
          : `Receive any amount on ${chain} to complete this quest.`,
    };
  }
  // send / swap / visit / none — confirmed by the action flow or manually.
  return { ok: true };
}
