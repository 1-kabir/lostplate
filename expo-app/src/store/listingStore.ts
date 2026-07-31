import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, ListingRow } from '../lib/supabase';
import { useAuthStore } from './authStore';

export type Urgency = 'green' | 'amber' | 'red';
// Real 5-state lifecycle from server/schema.sql — 'partial' and 'fully_claimed'
// still count as actionable/claimable (qty_remaining_kg > 0 for 'partial'),
// they are not the same thing as 'collected' or 'expired'.
export type Status = 'available' | 'partial' | 'fully_claimed' | 'collected' | 'expired';

export interface Listing {
  id: string;
  donorId: string;
  donorName: string;
  donorAddress: string;
  foodName: string;
  category: string;
  qty: number; // qty_remaining_kg — what's actually still claimable
  totalQty: number; // original qty_kg at listing time
  urgency: Urgency;
  status: Status;
  distance: string;
  timeRemaining: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  expiryAt: string;
  createdAt: string;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function urgencyFromExpiry(expiryAt: string): Urgency {
  const hoursLeft = (new Date(expiryAt).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft <= 1) return 'red';
  if (hoursLeft <= 4) return 'amber';
  return 'green';
}

export function timeRemainingFromExpiry(expiryAt: string): string {
  const ms = new Date(expiryAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'}`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

// Listings only carry donor_id in realtime payloads, so donor display names
// are resolved via a tiny in-memory cache against the public `users` table
// (readable to everyone per the "Allow public read profiles" RLS policy)
// rather than requiring a Postgres join for every row.
const donorNameCache = new Map<string, string>();
const donorAddressCache = new Map<string, string>();

async function resolveDonorName(donorId: string): Promise<string> {
  if (donorNameCache.has(donorId)) return donorNameCache.get(donorId)!;
  const { data } = await supabase.from('users').select('name').eq('id', donorId).single();
  const name = data?.name ?? 'Unknown donor';
  donorNameCache.set(donorId, name);
  return name;
}

async function resolveDonorAddress(donorId: string): Promise<string> {
  if (donorAddressCache.has(donorId)) return donorAddressCache.get(donorId)!;
  const { data } = await supabase.from('users').select('address').eq('id', donorId).single();
  const address = data?.address ?? '';
  donorAddressCache.set(donorId, address);
  return address;
}

function rowToListing(row: ListingRow, donorName: string, donorAddress: string): Listing {
  const viewer = useAuthStore.getState().user;
  const distance =
    viewer?.lat != null && viewer?.lng != null && row.lat != null && row.lng != null
      ? `${haversineKm(viewer.lat, viewer.lng, row.lat, row.lng).toFixed(1)} km`
      : '—';

  // Defensive client-side expiry: nothing runs a cron to flip DB status, so a
  // listing that's aged past its expiry window should still read as expired
  // in the UI even if the row is technically still 'available'.
  const isPastExpiry = new Date(row.expiry_at).getTime() < Date.now();
  const effectiveStatus: Status =
    isPastExpiry && (row.status === 'available' || row.status === 'partial') ? 'expired' : row.status;

  return {
    id: row.id,
    donorId: row.donor_id,
    donorName,
    donorAddress,
    foodName: row.food_name,
    category: row.category,
    qty: row.qty_remaining_kg,
    totalQty: row.qty_kg,
    urgency: urgencyFromExpiry(row.expiry_at),
    status: effectiveStatus,
    distance,
    timeRemaining: timeRemainingFromExpiry(row.expiry_at),
    lat: row.lat,
    lng: row.lng,
    photoUrl: row.photo_url,
    pickupWindowStart: row.pickup_window_start,
    pickupWindowEnd: row.pickup_window_end,
    expiryAt: row.expiry_at,
    createdAt: row.created_at,
  };
}

export interface NewListingInput {
  foodName: string;
  category: string;
  qtyKg: number;
  expiryWindow: string;
  expiryAt: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  photoUrl?: string | null;
}

interface ListingState {
  listings: Listing[];
  isLoading: boolean;
  channel: RealtimeChannel | null;
  fetchListings: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
  addListing: (input: NewListingInput) => Promise<{ error?: string; id?: string }>;
  claimListing: (listingId: string, qtyKg: number, pickupTimeIso: string) => Promise<{ error?: string; claimId?: string; qrToken?: string }>;
}

export const useListingStore = create<ListingState>((set, get) => ({
  listings: [],
  isLoading: false,
  channel: null,

  fetchListings: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch listings:', error.message);
      set({ isLoading: false });
      return;
    }

    const rows = (data ?? []) as ListingRow[];
    const details = await Promise.all(rows.map(async (r) => {
      const [name, address] = await Promise.all([
        resolveDonorName(r.donor_id),
        resolveDonorAddress(r.donor_id),
      ]);
      return { name, address };
    }));
    set({ listings: rows.map((r, i) => rowToListing(r, details[i].name, details[i].address)), isLoading: false });
  },

  subscribeRealtime: () => {
    if (get().channel) return;
    const channel = supabase
      .channel('listings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Partial<ListingRow>;
            set((state) => ({ listings: state.listings.filter((l) => l.id !== oldRow.id) }));
            return;
          }
          const row = payload.new as ListingRow;
          const [name, address] = await Promise.all([
            resolveDonorName(row.donor_id),
            resolveDonorAddress(row.donor_id),
          ]);
          const listing = rowToListing(row, name, address);
          set((state) => {
            const exists = state.listings.some((l) => l.id === listing.id);
            return {
              listings: exists
                ? state.listings.map((l) => (l.id === listing.id ? listing : l))
                : [listing, ...state.listings],
            };
          });
        }
      )
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

  addListing: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) return { error: 'Not signed in' };

    const { data, error } = await supabase
      .from('listings')
      .insert({
        donor_id: user.id,
        food_name: input.foodName,
        category: input.category,
        qty_kg: input.qtyKg,
        qty_remaining_kg: input.qtyKg,
        expiry_window: input.expiryWindow,
        expiry_at: input.expiryAt,
        photo_url: input.photoUrl ?? null,
        pickup_window_start: input.pickupWindowStart,
        pickup_window_end: input.pickupWindowEnd,
        lat: user.lat,
        lng: user.lng,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    const row = data as ListingRow;
    const listing = rowToListing(row, user.name ?? '', user.address ?? '');
    set((state) => ({ listings: [listing, ...state.listings] }));
    return { id: row.id };
  },

  // Delegates to the create_claim() Postgres function (see
  // server/migrations/001_auth_verification_and_claims.sql) so the qty
  // reservation and the claims insert happen atomically under a row lock —
  // two NGOs racing to claim the same surplus can never both succeed.
  claimListing: async (listingId, qtyKg, pickupTimeIso) => {
    const { data, error } = await supabase.rpc('create_claim', {
      p_listing_id: listingId,
      p_qty_claimed_kg: qtyKg,
      p_pickup_time: pickupTimeIso,
    });

    if (error) return { error: error.message };

    const claim = data as { id: string; qr_token: string };

    set((state) => ({
      listings: state.listings.map((l) => {
        if (l.id !== listingId) return l;
        const newRemaining = Math.max(0, l.qty - qtyKg);
        return { ...l, qty: newRemaining, status: newRemaining <= 0 ? 'fully_claimed' : 'partial' };
      }),
    }));

    return { claimId: claim?.id, qrToken: claim?.qr_token };
  },
}));
