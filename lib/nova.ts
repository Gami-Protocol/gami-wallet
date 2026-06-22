import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SEED_QUESTS } from '@/lib/quests';
import type { Persona } from '@/lib/store/gameStore';

/**
 * NOVA conversation layer.
 *
 * - Local persistence with a 30-day TTL (AsyncStorage) so chat survives offline.
 * - When signed in, replies stream from the `nova` edge function (Anthropic
 *   claude-sonnet-4-20250514) with tool calls.
 * - Offline / signed out, a persona-aware local responder keeps the chat
 *   functional and still emits a suggest_quest tool row.
 *
 * On-chain rule: NOVA reads balances and PROPOSES actions (propose_send) — it
 * never signs. The client renders proposals and the user confirms with Face ID.
 */

export type NovaToolCall = {
  name: string;
  summary: string;
  /** Raw tool input for actionable tools (e.g. propose_send, generate_quest). */
  input?: Record<string, unknown>;
};

export type NovaMessage = {
  id: string;
  role: 'user' | 'nova';
  content: string;
  ts: number;
  tools?: NovaToolCall[];
};

const KEY = 'gami.nova.messages.v1';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function loadMessages(): Promise<NovaMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    // eslint-disable-next-line typescript/no-unsafe-type-assertion -- shape validated below by filter
    const list = (parsed as NovaMessage[]).filter((m) => now - m.ts < TTL_MS);
    return list;
  } catch {
    return [];
  }
}

export async function saveMessages(messages: NovaMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(messages));
  } catch {
    // best-effort
  }
}

export async function clearMessages(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

const GREETINGS: Record<Persona, string> = {
  Hype: "YO. i'm NOVA, your wallet's brain. ready to stack some XP? 🔥",
  Chill: "hey, i'm NOVA. your wallet's brain. no rush — what's on your mind?",
  Pro: 'NOVA here. I track your wallet and surface the highest-value actions. How can I help?',
};

export function greeting(persona: Persona): string {
  return GREETINGS[persona];
}

const QUEST_INTROS: Record<Persona, string> = {
  Hype: 'easy. lock in this one and bank the XP 👇',
  Chill: "here's a solid next move whenever you're ready:",
  Pro: 'Recommended next action based on your progress:',
};

/** Persona-aware local responder used when the backend is unreachable. */
export function localRespond(prompt: string, persona: Persona): NovaMessage {
  const wantsQuest = /quest|do next|what should|next move|earn|xp/i.test(prompt);
  const pick = SEED_QUESTS.find((q) => q.novaPick) ?? SEED_QUESTS[1];
  if (wantsQuest) {
    return {
      id: `${Date.now()}-nova`,
      role: 'nova',
      content: `${QUEST_INTROS[persona]} ${pick.title} (${pick.code}) — +${pick.xp} XP.`,
      ts: Date.now(),
      tools: [{ name: 'suggest_quest', summary: 'suggest_quest', input: { title: pick.title } }],
    };
  }
  const fallback: Record<Persona, string> = {
    Hype: "i gotchu. ask me what quest to run, check your balance, or send some crypto. let's gooo.",
    Chill: 'happy to help — try asking what quest to do next, or about your balance.',
    Pro: 'I can suggest quests, summarize balances, or start a send flow. What would you like?',
  };
  return {
    id: `${Date.now()}-nova`,
    role: 'nova',
    content: fallback[persona],
    ts: Date.now(),
  };
}

export type WalletContext = {
  addresses?: { evm?: string; solana?: string };
  balances?: { chain: string; symbol: string; amount: string }[];
};

export type StreamHandlers = {
  onDelta: (text: string) => void;
  onTool: (tool: NovaToolCall) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

const TOOL_SUMMARY: Record<string, string> = {
  suggest_quest: 'suggest_quest',
  generate_quest: 'generate_quest',
  propose_send: 'propose_send',
  get_balance: 'get_balance',
};

/**
 * Stream a NOVA reply from the edge function. Returns true if the stream was
 * used; false if the backend is unavailable (caller should fall back to
 * localRespond).
 */
export async function streamReply(
  history: NovaMessage[],
  persona: Persona,
  wallet: WalletContext,
  handlers: StreamHandlers,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return false;

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/nova`;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: anon,
      },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        persona,
        wallet,
      }),
    });
  } catch {
    return false;
  }

  if (!resp.ok || !resp.body) {
    if (resp.status === 503) {
      handlers.onError('AI is not configured on the server yet.');
      handlers.onDone();
      return true;
    }
    return false;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        let evt: {
          type?: string;
          delta?: string;
          name?: string;
          input?: Record<string, unknown>;
          message?: string;
        };
        try {
          // eslint-disable-next-line typescript/no-unsafe-type-assertion -- JSON.parse returns any; shape validated by subsequent property checks
          evt = JSON.parse(json) as typeof evt;
        } catch {
          continue;
        }
        if (evt.type === 'text' && evt.delta) {
          handlers.onDelta(evt.delta);
        } else if (evt.type === 'tool' && evt.name) {
          handlers.onTool({
            name: evt.name,
            summary: TOOL_SUMMARY[evt.name] ?? evt.name,
            input: evt.input,
          });
        } else if (evt.type === 'error') {
          handlers.onError(evt.message ?? 'NOVA hit a snag.');
        }
      }
    }
    handlers.onDone();
    return true;
  } catch {
    return false;
  }
}

/** Persist a message to the remote nova_messages table (best-effort). */
export async function persistRemote(message: NovaMessage): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  await supabase.from('nova_messages').insert({
    user_id: uid,
    role: message.role,
    content: message.content,
    // NovaToolCall[] is structurally compatible with Json's array branch.
    // eslint-disable-next-line typescript/no-unsafe-type-assertion -- NovaToolCall[] satisfies Json array branch; shape is controlled by this module
    tools: message.tools ? (message.tools as unknown as import('@/lib/database.types').Json) : null,
  });
}
