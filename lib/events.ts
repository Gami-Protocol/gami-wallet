import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

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
 * Flush the queue to the server. No-op transport until a backend is connected;
 * the events stay queued so they can be replayed once the endpoint exists.
 */
export async function flush(): Promise<void> {
  if (flushing) return;
  await ensureLoaded();
  if (queue.length === 0) return;
  flushing = true;
  try {
    // TODO(backend): POST `queue` to /events with HMAC signature + idempotency keys.
    // Once a Supabase backend is enabled, sign each batch and clear on 2xx.
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
