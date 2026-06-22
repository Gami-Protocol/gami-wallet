import AsyncStorage from '@react-native-async-storage/async-storage';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/**
 * Supabase client. Auth scopes backend data (quests, NOVA history, events) via
 * RLS. The on-device wallet is independent of this session — signing in never
 * touches the mnemonic.
 *
 * Email OTP only: signUp/signIn send a 6-digit code, verified with verifyOtp.
 * No magic links, no redirect URLs.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'anon',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
