import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { type Quest, fromRow } from '@/lib/quests';
import type { Database } from '@/lib/database.types';

/**
 * Client wrappers for the AI edge functions (nova chat + generate-quest).
 * All calls forward the user's JWT via supabase.functions.invoke so RLS and
 * server-side auth apply.
 */

export type GeneratedQuest = {
  title: string;
  blurb: string;
  xp: number;
  accent: string;
  action_type: string;
  action_chain?: string | null;
  action_address?: string | null;
  action_min_amount?: number | null;
};

export type GenerateResult = { ok: true; quests: Quest[] } | { ok: false; error: string };

/**
 * Ask the AI to design quests. When `save` is true the quests are persisted and
 * returned as full Quest rows; otherwise drafts are returned for preview.
 */
export async function generateQuests(opts: {
  prompt: string;
  mode: 'personal' | 'business';
  save: boolean;
  count?: number;
}): Promise<GenerateResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Backend not configured.' };
  const { data, error } = await supabase.functions.invoke<{
    quests?: (GeneratedQuest | Database['public']['Tables']['quests']['Row'])[];
    error?: string;
  }>('generate-quest', {
    body: { prompt: opts.prompt, mode: opts.mode, save: opts.save, count: opts.count ?? 1 },
  });

  if (error) {
    return { ok: false, error: humanizeFnError(error.message) };
  }
  if (!data || data.error) {
    return { ok: false, error: data?.error ?? 'Generation failed.' };
  }

  const rows = data.quests ?? [];
  // Saved rows have an `id`; drafts do not.
  const quests: Quest[] = rows.map((q) =>
    'id' in q
      ? fromRow(q)
      : {
          id: `draft-${Math.random().toString(36).slice(2)}`,
          code: 'DRAFT',
          title: q.title,
          blurb: q.blurb,
          xp: q.xp,
          accent: normalizeAccent(q.accent),
          origin: opts.mode === 'business' ? ('business' as const) : ('user' as const),
          scope: opts.mode === 'business' ? ('global' as const) : ('personal' as const),
          action: {
            type: normalizeAction(q.action_type),
            chain: normalizeChain(q.action_chain),
            address: q.action_address ?? undefined,
            minAmount: q.action_min_amount ?? undefined,
          },
          isSeed: false,
        },
  );
  return { ok: true, quests };
}

function humanizeFnError(message: string): string {
  if (message.includes('not configured') || message.includes('503')) {
    return 'AI is not configured on the server yet.';
  }
  if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
    return 'Sign in to use AI quest generation.';
  }
  return 'Could not reach the AI service. Try again.';
}

function normalizeAccent(value: string): Quest['accent'] {
  const allowed = ['purple', 'magenta', 'lime', 'yellow', 'cyan'];
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return allowed.includes(value) ? (value as Quest['accent']) : 'lime';
}

function normalizeAction(value: string): Quest['action']['type'] {
  const allowed = ['none', 'visit', 'receive', 'send', 'swap', 'hold'];
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return allowed.includes(value) ? (value as Quest['action']['type']) : 'none';
}

function normalizeChain(value: string | null | undefined): Quest['action']['chain'] {
  const allowed = ['base', 'polygon', 'arbitrum', 'solana'];
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by .includes() check above
  return value && allowed.includes(value) ? (value as Quest['action']['chain']) : undefined;
}
