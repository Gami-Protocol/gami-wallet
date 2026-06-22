import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { type AutoLock, useGameStore } from '@/lib/store/gameStore';

/**
 * Auto-lock: when the app returns to the foreground after being backgrounded
 * longer than the configured window, the wallet locks and requires
 * re-authentication. Driven by the `autoLock` + `faceIdEnabled` store prefs.
 */

function windowMs(autoLock: AutoLock): number | null {
  if (autoLock === 'never') return null;
  return Number(autoLock) * 60_000;
}

/**
 * Returns whether the app is currently locked plus an `unlock` callback.
 * Locking only applies when Face ID is enabled and a finite window is set.
 */
export function useAutoLock(): { locked: boolean; unlock: () => void } {
  const autoLock = useGameStore((s) => s.autoLock);
  const faceIdEnabled = useGameStore((s) => s.faceIdEnabled);
  const walletReady = useGameStore((s) => s.walletReady);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        const ms = windowMs(autoLock);
        if (!faceIdEnabled || !walletReady || ms === null || since === null) return;
        if (Date.now() - since >= ms) setLocked(true);
      } else if (state === 'background' || state === 'inactive') {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [autoLock, faceIdEnabled, walletReady]);

  return { locked, unlock: () => setLocked(false) };
}
