-- Migration 001: Real auth verification state + atomic claim creation
-- Run this in the Supabase SQL editor against the EXISTING project.
-- Safe to run multiple times (idempotent additive changes).

-- 1. Onboarding completion flag (drives the app's onboarding gate instead of
--    inferring it from nullable columns).
alter table public.users
  add column if not exists onboarded boolean not null default false;

-- 2. Tri-state verification workflow (unsubmitted -> pending -> approved).
--    `verified` boolean is kept in sync for backward-compat with the
--    Smart Match engine query (server/routes/match.js filters on `verified`).
alter table public.users
  add column if not exists verification_status text not null default 'unsubmitted'
  check (verification_status in ('unsubmitted', 'pending', 'approved'));

-- 2b. NGO dietary constraint (Vegetarian / Non-Vegetarian / Both). Kept
--     separate from `food_prefs`, which stores food CATEGORY preferences
--     (Cooked Meals / Raw Produce / etc.) and is what the Smart Match engine
--     (server/routes/match.js) actually compares against a listing's
--     category. The original onboarding screen only collected diet type and
--     never populated food_prefs at all, which silently made the match
--     engine's preference scoring a no-op for every NGO.
alter table public.users
  add column if not exists diet_pref text;

-- 2c. NGO registration number, captured on onboarding step 1 but previously
--     discarded after being typed (never sent anywhere).
alter table public.users
  add column if not exists registration_number text;

-- Backfill: anyone already marked verified=true should read as approved.
update public.users set verification_status = 'approved' where verified = true and verification_status = 'unsubmitted';

-- 3. Atomic claim creation.
--    Reserves qty at claim time (not at pickup time) so two NGOs can never
--    double-claim the same surplus kg. Runs as SECURITY DEFINER so it can
--    update the listing row under a row lock, but still enforces that the
--    caller can only create a claim for themselves via auth.uid().
create or replace function public.create_claim(
  p_listing_id uuid,
  p_qty_claimed_kg numeric,
  p_pickup_time timestamptz
) returns public.claims
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_claim public.claims%rowtype;
  v_new_remaining int;
  v_new_status text;
  v_qty_int int;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_qty_int := p_qty_claimed_kg::int;

  if v_qty_int is null or v_qty_int <= 0 then
    raise exception 'qty_claimed_kg must be positive';
  end if;

  -- Row lock prevents a race between two simultaneous claims on the same listing.
  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status in ('collected', 'expired') then
    raise exception 'Listing is no longer available';
  end if;

  if v_listing.qty_remaining_kg < v_qty_int then
    raise exception 'Requested quantity (%) exceeds available quantity (%)', v_qty_int, v_listing.qty_remaining_kg;
  end if;

  v_new_remaining := v_listing.qty_remaining_kg - v_qty_int;
  v_new_status := case when v_new_remaining <= 0 then 'fully_claimed' else 'partial' end;

  update public.listings
    set qty_remaining_kg = v_new_remaining, status = v_new_status
    where id = p_listing_id;

  insert into public.claims (listing_id, ngo_id, qty_claimed_kg, pickup_time, qr_token)
    values (p_listing_id, auth.uid(), v_qty_int, p_pickup_time, replace(gen_random_uuid()::text, '-', ''))
    returning * into v_claim;

  return v_claim;
end;
$$;

grant execute on function public.create_claim(uuid, numeric, timestamptz) to authenticated;

-- 4. Storage bucket for listing photos (donor list-food.tsx uploads here
--    directly from the device before insert). Public read so photos render
--    in both apps without signed URLs; write is restricted to signed-in
--    users, each scoped to a folder named after their own user id.
insert into storage.buckets (id, name, public)
  values ('listing-photos', 'listing-photos', true)
  on conflict (id) do nothing;

drop policy if exists "Public read listing photos" on storage.objects;
create policy "Public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "Authenticated users upload own listing photos" on storage.objects;
create policy "Authenticated users upload own listing photos" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Impact aggregate helper (used by server/routes/impact.js via the
--    service role client, but declared here so the logic lives with the schema).
--    Counts only completed pickups as "real" impact, not merely reserved claims.
create or replace view public.donor_impact as
select
  l.donor_id as user_id,
  coalesce(sum(c.qty_claimed_kg), 0)::int as total_kg,
  count(distinct c.ngo_id) as partner_count,
  min(l.created_at) as member_since
from public.listings l
join public.claims c on c.listing_id = l.id and c.status = 'completed'
group by l.donor_id;

create or replace view public.ngo_impact as
select
  c.ngo_id as user_id,
  coalesce(sum(c.qty_claimed_kg), 0)::int as total_kg,
  count(distinct l.donor_id) as partner_count,
  min(c.created_at) as member_since
from public.claims c
join public.listings l on l.id = c.listing_id
where c.status = 'completed'
group by c.ngo_id;
