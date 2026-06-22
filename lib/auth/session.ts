import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Email-OTP auth session. Sign-in sends a 6-digit code; verifyOtp completes it.
 * No magic links, no redirect URLs.
 *
 * The wallet is independent — the session only scopes backend data (remote
 * quests, NOVA history, events). The app remains usable when signed out; remote
 * features simply fall back to local behaviour.
 */

export type AuthState = {
  session: Session | null;
  loading: boolean;
};

export function useSession(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export type OtpResult = { ok: boolean; error?: string };

/** Send a 6-digit sign-in code to the email. Creates the user if new. */
export async function requestCode(email: string): Promise<OtpResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Backend not configured.' };
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Verify the 6-digit code and establish a session. */
export async function verifyCode(email: string, token: string): Promise<OtpResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Backend not configured.' };
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/** Imperative session accessor for non-hook contexts. */
export function useAccessToken(): { token: string | null; userId: string | null } {
  const { session } = useSession();
  return { token: session?.access_token ?? null, userId: session?.user.id ?? null };
}

export function useAuthActions() {
  const request = useCallback((email: string) => requestCode(email), []);
  const verify = useCallback((email: string, token: string) => verifyCode(email, token), []);
  return { request, verify, signOut };
}
