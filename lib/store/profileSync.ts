import { useEffect, useRef } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store/gameStore';
import { useSession } from '@/lib/auth/session';

/**
 * Two-way profile sync between the local game store and the remote profiles
 * table. On sign-in, the higher XP/level wins (so progress is never lost), and
 * handle/persona are pushed up. The wallet is never touched here.
 */
export function useProfileSync(): void {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const handle = useGameStore((s) => s.handle);
  const persona = useGameStore((s) => s.persona);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const grantXp = useGameStore((s) => s.grantXp);

  // Track which userId we have already reconciled so the effect only fires once
  // per sign-in session without disabling the exhaustive-deps rule.
  const reconciledFor = useRef<string | null>(null);

  // On sign-in, reconcile XP (take the max) and push handle/persona up.
  useEffect(() => {
    let cancelled = false;
    if (isSupabaseConfigured && userId && reconciledFor.current !== userId) {
      reconciledFor.current = userId;
      // Snapshot local values at reconciliation time so the async path is stable.
      const localXp = xp;
      const localHandle = handle;
      const localPersona = persona;
      void (async () => {
        const { data } = await supabase
          .from('profiles')
          .select('xp, level, handle, persona')
          .eq('id', userId)
          .maybeSingle();
        if (cancelled) return;
        const remoteXp = data?.xp ?? 0;
        if (remoteXp > localXp) {
          grantXp(remoteXp - localXp);
        }
        await supabase
          .from('profiles')
          .update({
            handle: localHandle ?? data?.handle ?? null,
            persona: localPersona,
            xp: Math.max(remoteXp, localXp),
          })
          .eq('id', userId);
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [userId, xp, handle, persona, grantXp]);

  // Keep handle/persona/xp mirrored upward as they change locally.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;
    void supabase.from('profiles').update({ handle, persona, xp, level }).eq('id', userId);
  }, [userId, handle, persona, xp, level]);
}
