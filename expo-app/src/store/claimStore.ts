import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, ClaimRow, ListingRow } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { apiService } from '../lib/api';

export interface Claim {
  id: string;
  listingId: string;
  ngoId: string;
  ngoName: string;
  donorId: string;
  donorName: string;
  donorAddress: string;
  lat: number | null;
  lng: number | null;
  foodName: string;
  category: string;
  qtyClaimedKg: number;
  pickupTime: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  qrToken: string;
  completedAt: string | null;
  createdAt: string;
}

// Small in-memory lookup caches — claims rows only carry foreign keys, so
// listing/user details are resolved lazily rather than via a guessed
// PostgREST embed hint (Postgres auto-names FK constraints, and depending on
// that name being exactly right is more fragile than two extra round trips).
const listingCache = new Map<string, ListingRow>();
const nameCache = new Map<string, string>();
const addressCache = new Map<string, string>();

async function resolveListing(listingId: string): Promise<ListingRow | null> {
  if (listingCache.has(listingId)) return listingCache.get(listingId)!;
  const { data } = await supabase.from('listings').select('*').eq('id', listingId).single();
  if (data) listingCache.set(listingId, data as ListingRow);
  return (data as ListingRow) ?? null;
}

async function resolveName(userId: string): Promise<string> {
  if (nameCache.has(userId)) return nameCache.get(userId)!;
  const { data } = await supabase.from('users').select('name').eq('id', userId).single();
  const name = data?.name ?? 'Unknown';
  nameCache.set(userId, name);
  return name;
}

async function resolveAddress(userId: string): Promise<string> {
  if (addressCache.has(userId)) return addressCache.get(userId)!;
  const { data } = await supabase.from('users').select('address').eq('id', userId).single();
  const address = data?.address ?? '';
  addressCache.set(userId, address);
  return address;
}

async function rowToClaim(row: ClaimRow): Promise<Claim> {
  const listing = await resolveListing(row.listing_id);
  const [ngoName, donorName, donorAddress] = await Promise.all([
    resolveName(row.ngo_id),
    listing ? resolveName(listing.donor_id) : Promise.resolve('Unknown donor'),
    listing ? resolveAddress(listing.donor_id) : Promise.resolve(''),
  ]);

  return {
    id: row.id,
    listingId: row.listing_id,
    ngoId: row.ngo_id,
    ngoName,
    donorId: listing?.donor_id ?? '',
    donorName,
    donorAddress,
    lat: listing?.lat ?? null,
    lng: listing?.lng ?? null,
    foodName: listing?.food_name ?? 'Listing removed',
    category: listing?.category ?? '',
    qtyClaimedKg: row.qty_claimed_kg,
    pickupTime: row.pickup_time,
    status: row.status,
    qrToken: row.qr_token,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

interface ClaimState {
  claims: Claim[];
  isLoading: boolean;
  channel: RealtimeChannel | null;
  // NGO side: claims they've made.
  fetchMyClaims: () => Promise<void>;
  // Donor side: claims placed against any of their own listings.
  fetchClaimsOnMyListings: () => Promise<void>;
  subscribeRealtime: (mode: 'ngo' | 'donor') => void;
  unsubscribeRealtime: () => void;
  verifyPickup: (qrToken: string) => Promise<{ error?: string; success?: boolean }>;
}

export const useClaimStore = create<ClaimState>((set, get) => ({
  claims: [],
  isLoading: false,
  channel: null,

  fetchMyClaims: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('ngo_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch claims:', error.message);
      set({ isLoading: false });
      return;
    }
    const claims = await Promise.all(((data ?? []) as ClaimRow[]).map(rowToClaim));
    set({ claims, isLoading: false });
  },

  fetchClaimsOnMyListings: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoading: true });

    const { data: myListings, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('donor_id', user.id);

    if (listingsError || !myListings || myListings.length === 0) {
      set({ claims: [], isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .in('listing_id', myListings.map((l) => l.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch claims on listings:', error.message);
      set({ isLoading: false });
      return;
    }
    const claims = await Promise.all(((data ?? []) as ClaimRow[]).map(rowToClaim));
    set({ claims, isLoading: false });
  },

  subscribeRealtime: (mode) => {
    if (get().channel) return;
    const channel = supabase
      .channel(`claims-realtime-${mode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as Partial<ClaimRow>;
          set((state) => ({ claims: state.claims.filter((c) => c.id !== oldRow.id) }));
          return;
        }
        const row = payload.new as ClaimRow;
        const user = useAuthStore.getState().user;
        if (!user) return;

        // Only merge in claims relevant to this viewer — NGOs care about
        // their own claims, donors care about claims on their listings.
        const listing = await resolveListing(row.listing_id);
        const relevant = mode === 'ngo' ? row.ngo_id === user.id : listing?.donor_id === user.id;
        if (!relevant) return;

        const claim = await rowToClaim(row);
        set((state) => {
          const exists = state.claims.some((c) => c.id === claim.id);
          return {
            claims: exists ? state.claims.map((c) => (c.id === claim.id ? claim : c)) : [claim, ...state.claims],
          };
        });
      })
      .subscribe();
    set({ channel });
  },

  unsubscribeRealtime: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },

  // Routed through the Express backend (server/routes/claims.js) rather than
  // a direct Supabase update — verification is a server-owned trust boundary
  // (the QR token itself is the credential, not the caller's identity).
  verifyPickup: async (qrToken) => {
    try {
      const result = await apiService.verifyClaimQr(qrToken);
      if (result.success) {
        set((state) => ({
          claims: state.claims.map((c) =>
            c.qrToken === qrToken ? { ...c, status: 'completed', completedAt: new Date().toISOString() } : c
          ),
        }));
      }
      return result;
    } catch (err: any) {
      return { error: err?.response?.data?.error ?? err?.message ?? 'Verification failed' };
    }
  },
}));
