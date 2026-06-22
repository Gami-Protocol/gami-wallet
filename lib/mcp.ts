/**
 * Client for the Gami Protocol agentic MCP backend (gami-protocol-mcp).
 *
 * Powers NOVA's quest generation via `POST /api/quests/generate`, which routes
 * to the backend's Quest agent for personalized, cohort-aware quests. This is a
 * progressive enhancement: when the base URL is unset, or any request fails,
 * callers fall back to the local responder so the wallet always works offline.
 *
 * Configure the base URL with EXPO_PUBLIC_GAMI_MCP_URL
 * (e.g. https://mcp.gamiprotocol.io). The backend defaults to port 9000.
 */

const MCP_BASE_URL = (process.env.EXPO_PUBLIC_GAMI_MCP_URL ?? '').replace(/\/+$/, '');

const TIMEOUT_MS = 12000;

export function isMcpConfigured(): boolean {
  return MCP_BASE_URL.length > 0;
}

/** Profile sent as `user_identity` to the quest agent. */
export type McpUserProfile = {
  walletId?: string;
  xp?: number;
  reputationScore?: number;
  persona?: string;
  interests?: string[];
};

/**
 * Quest as returned by the MCP backend. The agent's exact payload varies, so
 * every field is optional and normalized defensively by `normalizeMcpQuest`.
 */
export type McpQuest = {
  quest_id?: string;
  title?: string;
  description?: string;
  narrative?: string;
  objective?: string;
  xp_reward?: number;
  xp?: number;
  reward?: number;
  difficulty_rating?: number;
  cohort?: string;
};

export type NormalizedQuest = { code: string; title: string; blurb: string; xp: number };

/**
 * Ask the MCP backend to generate a personalized quest. Resolves to null when
 * the backend is unconfigured, times out, or returns a non-OK / malformed
 * response — never throws — so callers can fall back cleanly.
 */
export async function generateQuest(profile: McpUserProfile): Promise<McpQuest | null> {
  if (!isMcpConfigured()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${MCP_BASE_URL}/api/quests/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_identity: {
          wallet_id: profile.walletId,
          xp_balance: profile.xp ?? 0,
          reputation_score: profile.reputationScore ?? 0,
          persona: profile.persona,
          interests: profile.interests ?? [],
        },
        recent_events: [],
        total_quests_completed: 0,
        average_completion_time: 0,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') return null;
    // eslint-disable-next-line typescript/no-unsafe-type-assertion -- all fields optional + normalized
    return data as McpQuest;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Collapse a backend quest into the display fields the UI expects. */
export function normalizeMcpQuest(q: McpQuest): NormalizedQuest {
  const code = q.quest_id ? `MCP_${q.quest_id.slice(0, 8).toUpperCase()}` : 'MCP_QUEST';
  const title = q.title ?? 'New quest';
  const blurb = q.description ?? q.narrative ?? q.objective ?? 'Complete this quest to earn XP.';
  const xp = q.xp_reward ?? q.xp ?? q.reward ?? 100;
  return { code, title, blurb, xp };
}
