-- Migration 003: keep a donor's active listings' coordinates in sync with
-- their profile address.
--
-- public.listings.lat/lng is a one-time snapshot copied from the donor's
-- profile at listing-creation time (see addListing() in listingStore.ts).
-- Nothing updates it afterward, so if a donor edits their address, every
-- listing they already posted keeps pointing NGOs at the donor's OLD
-- location forever (Browse distance, the map screen, and the claim
-- sheet's "open in maps" link all read this column).
--
-- This trigger cascades a donor's new lat/lng onto their still-claimable
-- listings only ('available' / 'partial') — completed pickups keep the
-- location they were actually collected from as an honest historical
-- record, rather than being silently rewritten after the fact.

create or replace function public.sync_listing_coords_on_donor_move()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.lat is distinct from old.lat or new.lng is distinct from old.lng then
    update public.listings
    set lat = new.lat, lng = new.lng
    where donor_id = new.id
      and status in ('available', 'partial');
  end if;
  return new;
end;
$$;

drop trigger if exists on_donor_address_updated on public.users;

create trigger on_donor_address_updated
after update on public.users
for each row
when (new.type = 'donor')
execute function public.sync_listing_coords_on_donor_move();
