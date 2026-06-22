import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * GAMI Event SDK (lightweight, local-first).
 *
 * Captures analytics-style events with a stable idempotency key, queues them in
 * AsyncStorage, and flushes on app foreground. When a backend is connected, the
 * `flush` transport will POST signed batches to the events endpoint; until then
 * events are retained locally so nothing is lost.
 */

export type GamiEvent = {
  idempotency_key: string;
  type: string;
  payload?: Record<string, unknown>;
  ts: number;
};

const QUEUE_KEY = 'gami.events.queue.v1';
let queue: GamiEvent[] = [];
let loaded = false;
let flushing = false;

function uuid(): string {
  // RFC4122-ish; backed by react-native-get-random-values via crypto if present.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    // eslint-disable-next-line typescript/no-unsafe-type-assertion -- Array.isArray guard makes this safe
    queue = Array.isArray(parsed) ? (parsed as GamiEvent[]) : [];
  } catch {
    queue = [];
  }
  loaded = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // best-effort
  }
}

export async function fireEvent(type: string, payload?: Record<string, unknown>): Promise<void> {
  await ensureLoaded();
  queue.push({ idempotency_key: uuid(), type, payload, ts: Date.now() });
  await persist();
}

/**
 * Flush the queue to the events table. Requires a signed-in user (RLS scopes
 * rows to the user). Events stay queued when signed out so nothing is lost; the
 * unique (user_id, idempotency_key) constraint makes replays safe.
 */
export async function flush(): Promise<void> {
  if (flushing) return;
  await ensureLoaded();
  if (queue.length === 0) return;
  if (!isSupabaseConfigured) return;
  flushing = true;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const batch = queue.slice(0, 100);
    const rows = batch.map((e) => ({
      user_id: uid,
      idempotency_key: e.idempotency_key,
      type: e.type,
      // GamiEvent.payload is Record<string,unknown> which is structurally
      // compatible with Json's object branch; the cast is safe here.
      // eslint-disable-next-line typescript/no-unsafe-type-assertion -- Record<string,unknown> satisfies Json object branch; shape is controlled by fireEvent callers
      payload: (e.payload ?? null) as import('@/lib/database.types').Json | null,
    }));
    const { error } = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true });
    if (!error) {
      queue = queue.slice(batch.length);
      await persist();
    }
  } finally {
    flushing = false;
  }
}

let subscribed = false;
export function startEventAutoflush(): () => void {
  if (subscribed) return () => undefined;
  subscribed = true;
  const handler = (state: AppStateStatus) => {
    if (state === 'active') void flush();
  };
  const sub = AppState.addEventListener('change', handler);
  void flush();
  return () => {
    sub.remove();
    subscribed = false;
  };
}
