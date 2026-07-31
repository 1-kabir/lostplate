-- Migration: Auto-Sync Supabase Auth Users to Public Profile Users Table
-- Description: Sets up a Postgres Trigger definition to automatically duplicate new accounts 
--              created via Supabase Auth signup into our public.users profile table.
--              This bypasses client-side RLS insert policies during initial registration.

-- Ensure necessary profile fields exist in public.users table
alter table public.users add column if not exists onboarded boolean default false;
alter table public.users add column if not exists verification_status text default 'unsubmitted';
alter table public.users add column if not exists registration_number text;
alter table public.users add column if not exists diet_pref text;

-- 1. Create the trigger function definition
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (
    id, 
    email, 
    type, 
    name, 
    org_type, 
    verified, 
    onboarded, 
    verification_status
  )
  values (
    new.id,
    new.email,
    -- Read metadata parameters passed from the client signUp function
    coalesce(new.raw_user_meta_data->>'type', 'donor'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'orgType',
    false, -- verified starts false
    false, -- onboarded starts false
    'unsubmitted' -- verification starts unsubmitted
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Bind trigger handler to auth.users insertion hook
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Relax insert policy since trigger operates under security definer (admin)
--    This ensures client store fallbacks do not crash during execution
drop policy if exists "Allow users to insert own profile" on public.users;
create policy "Allow insert profiles at signup" on public.users
  for insert with check (true);
