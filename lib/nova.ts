import AsyncStorage from '@react-native-async-storage/async-storage';

import { QUESTS } from '@/lib/quests';
import type { Persona } from '@/lib/store/gameStore';

/**
 * Local NOVA conversation store with a 30-day TTL. Messages persist to
 * AsyncStorage; entries older than the TTL are pruned on load.
 *
 * Streaming replies come from the server proxy (/nova/stream -> Anthropic
 * claude-sonnet-4-20250514) once a backend is connected. Until then a local
 * persona-aware responder keeps the experience functional and still emits the
 * `suggest_quest` tool call so the UI renders tool rows end-to-end.
 */

export type NovaToolCall = { name: string; summary: string };

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

/**
 * Local responder used until the streaming backend is wired. Detects quest
 * intent and returns a reply plus a `suggest_quest` tool call so the chat
 * renders the collapsed tool row.
 *
 * TODO(backend): replace with a streaming fetch to /nova/stream that proxies to
 * Anthropic, signs requests server-side, and streams tokens + tool_use events.
 */
export function localRespond(prompt: string, persona: Persona): NovaMessage {
  const wantsQuest = /quest|do next|what should|next move|earn|xp/i.test(prompt);
  const pick = QUESTS.find((q) => q.novaPick) ?? QUESTS[1];
  if (wantsQuest) {
    return {
      id: `${Date.now()}-nova`,
      role: 'nova',
      content: `${QUEST_INTROS[persona]} ${pick.title} (${pick.code}) — +${pick.xp} XP.`,
      ts: Date.now(),
      tools: [{ name: 'suggest_quest', summary: `suggested ${pick.code}` }],
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
