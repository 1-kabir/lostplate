import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase, UserRow } from '../lib/supabase';

export interface User {
  id: string;
  type: 'donor' | 'ngo';
  name: string;
  email: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  orgType: string | null;
  foodPrefs: string[];
  dietPref: string | null;
  registrationNumber: string | null;
  maxCapacityKg: number;
  pickupRadiusKm: number;
  verified: boolean;
  onboarded: boolean;
  verificationStatus: 'unsubmitted' | 'pending' | 'approved';
  expoPushToken: string | null;
  createdAt: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    type: row.type,
    name: row.name ?? '',
    email: row.email,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    orgType: row.org_type,
    foodPrefs: row.food_prefs ?? [],
    dietPref: row.diet_pref ?? null,
    registrationNumber: row.registration_number ?? null,
    maxCapacityKg: row.max_capacity_kg,
    pickupRadiusKm: row.pickup_radius_km,
    verified: row.verified,
    onboarded: row.onboarded,
    verificationStatus: row.verification_status,
    expoPushToken: row.expo_push_token,
    createdAt: row.created_at,
  };
}

interface AuthResult {
  error?: string;
  needsEmailVerification?: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  signUp: (params: { email: string; password: string; type: 'donor' | 'ngo'; name: string }) => Promise<AuthResult>;
  signIn: (params: { email: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    orgType: string;
    foodPrefs: string[];
    dietPref: string;
    registrationNumber: string;
    maxCapacityKg: number;
    pickupRadiusKm: number;
    expoPushToken: string;
  }>) => Promise<AuthResult>;
  updateUserProfile: (data: Partial<{
    name: string;
    address: string;
    orgType: string;
    registrationNumber: string;
    maxCapacityKg: number;
    lat: number;
    lng: number;
  }>) => Promise<AuthResult>;
  setOnboarded: () => Promise<void>;
  submitVerification: () => Promise<void>;
  approveVerification: () => Promise<void>;
  resendConfirmationEmail: () => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

// camelCase app fields -> snake_case DB columns
const FIELD_MAP: Record<string, string> = {
  name: 'name',
  address: 'address',
  lat: 'lat',
  lng: 'lng',
  orgType: 'org_type',
  foodPrefs: 'food_prefs',
  dietPref: 'diet_pref',
  registrationNumber: 'registration_number',
  maxCapacityKg: 'max_capacity_kg',
  pickupRadiusKm: 'pickup_radius_km',
  expoPushToken: 'expo_push_token',
};

async function fetchProfile(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) {
    console.warn('Failed to fetch user profile:', error.message);
    return null;
  }
  return data as UserRow;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isInitializing: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ session, user: profile ? rowToUser(profile) : null, isInitializing: false });
    } else {
      set({ session: null, user: null, isInitializing: false });
    }

    // Keep the store in sync with token refreshes, external sign-outs, etc.
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const profile = await fetchProfile(newSession.user.id);
        set({ session: newSession, user: profile ? rowToUser(profile) : null });
      } else {
        set({ session: null, user: null });
      }
    });
  },

  signUp: async ({ email, password, type, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { type, name } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up failed. Please try again.' };

    // When email confirmation is enabled Supabase returns a user but session
    // is null — we must wait for the user to click the link before we can
    // write to protected tables. Signal this to the caller.
    if (!data.session) {
      // Store the partial session so resendConfirmationEmail can read the email
      set({ session: null, user: null });
      return { needsEmailVerification: true };
    }

    // Email confirmation is disabled, so we already have a live session.
    // The on_auth_user_created trigger (server/migrations/002_*.sql) fires
    // synchronously inside the same insert that created this auth user, so
    // the matching public.users row already exists by the time we get here
    // — fetch it rather than inserting again, which would always fail with
    // a duplicate primary key.
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: 'Account created but profile could not be loaded. Please try logging in.' };

    set({ session: data.session, user: rowToUser(profile) });
    return {};
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Login failed. Please try again.' };

    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: 'Could not load your profile. Please try again.' };

    set({ session: data.session, user: rowToUser(profile) });
    return {};
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  updateUser: async (patch) => {
    const { user } = get();
    if (!user) return { error: 'Not signed in' };

    const dbPatch: Record<string, unknown> = {};
    for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
      const dbKey = FIELD_MAP[key];
      if (dbKey) dbPatch[dbKey] = (patch as any)[key];
    }

    const { data, error } = await supabase
      .from('users')
      .update(dbPatch)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return { error: error.message };

    set({ user: rowToUser(data as UserRow) });
    return {};
  },

  updateUserProfile: async (patch) => {
    return get().updateUser(patch);
  },

  setOnboarded: async () => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .update({ onboarded: true })
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) set({ user: rowToUser(data as UserRow) });
  },

  submitVerification: async () => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .update({ verification_status: 'pending' })
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) set({ user: rowToUser(data as UserRow) });
  },

  approveVerification: async () => {
    // Demo-mode shortcut (no admin review pipeline yet): flips straight to
    // approved and keeps the legacy `verified` boolean in sync so the
    // Smart Match engine (server/routes/match.js, filters on `verified`)
    // continues to work unchanged.
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .update({ verification_status: 'approved', verified: true })
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) set({ user: rowToUser(data as UserRow) });
  },

  resendConfirmationEmail: async () => {
    const { session } = get();
    const email = session?.user?.email;
    if (!email) return { error: 'No email address found on your account.' };
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { error: error.message };
    return {};
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await fetchProfile(user.id);
    if (profile) set({ user: rowToUser(profile) });
  },
}));
