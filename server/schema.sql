-- Supabase Database Schema SQL Script
-- Execute this script in your Supabase project's SQL Editor

-- 1. Enable UUID Extension if not already present
create extension if not exists "uuid-ossp";

-- 2. Create users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  type text not null check (type in ('donor', 'ngo')),
  name text,
  org_type text,                 -- donor: Individual/Restaurant/Hotel/etc
  address text,
  lat float8,
  lng float8,
  food_prefs text[],             -- NGO: ['Cooked Meals', 'Raw Produce', etc]
  max_capacity_kg int default 50, -- NGO only
  pickup_radius_km int default 10,-- NGO only
  verified boolean default false,
  expo_push_token text,
  created_at timestamptz default now()
);

-- 3. Create listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.users(id) on delete cascade not null,
  food_name text not null,
  category text not null,        -- Cooked Meals / Raw Produce / Packaged Goods / Beverages / Bakery
  qty_kg int not null,
  qty_remaining_kg int not null,
  expiry_window text not null,   -- 'Now' / 'Within 2h' / 'Within 6h' / 'Today'
  expiry_at timestamptz not null,
  photo_url text,
  status text not null default 'available' check (status in ('available', 'partial', 'fully_claimed', 'collected', 'expired')),
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  lat float8,
  lng float8,
  created_at timestamptz default now()
);

-- 4. Create claims table
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  ngo_id uuid references public.users(id) on delete cascade not null,
  qty_claimed_kg int not null,
  pickup_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  qr_token text unique not null,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 5. Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.claims enable row level security;

-- Users policies
create policy "Allow public read profiles" on public.users
  for select using (true);

create policy "Allow users to update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Allow users to insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Listings policies
create policy "Allow public read available listings" on public.listings
  for select using (true);

create policy "Allow donors to manage own listings" on public.listings
  for all using (auth.uid() = donor_id);

-- Claims policies
create policy "Allow users to select associated claims" on public.claims
  for select using (
    auth.uid() = ngo_id or 
    auth.uid() in (select donor_id from public.listings where id = listing_id)
  );

create policy "Allow NGOs to insert claims" on public.claims
  for insert with check (auth.uid() = ngo_id);

create policy "Allow associated parties to update claims" on public.claims
  for update using (
    auth.uid() = ngo_id or 
    auth.uid() in (select donor_id from public.listings where id = listing_id)
  );

-- 6. Enable realtime replication
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.claims;
