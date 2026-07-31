# Lost Plate — Master Task List

## Project Setup

- [ ] Init Expo project (managed workflow, Expo Router)
- [ ] Init Express server (`server/` in monorepo)
- [ ] Create Supabase project, grab URL + anon key
- [ ] Create GitHub repo, push initial scaffold
- [ ] Deploy Express to Railway (free tier)

## Supabase

- [ ] Create `users` table (id, email, type, name, org_type, address, lat, lng, food_prefs, max_capacity_kg, pickup_radius_km, verified, expo_push_token)
- [ ] Create `listings` table (id, donor_id, food_name, category, qty_kg, qty_remaining_kg, expiry_window, expiry_at, photo_url, status, pickup_window_start/end, lat, lng)
- [ ] Create `claims` table (id, listing_id, ngo_id, qty_claimed_kg, pickup_time, status, qr_token, completed_at)
- [ ] Write RLS policies (users own their data, NGOs read available listings)
- [ ] Enable Realtime on `listings` and `claims`
- [ ] Create `impact_stats` view

## Auth + Onboarding

- [ ] Login screen — donor/NGO toggle, email+password via Supabase Auth
- [ ] Donor onboarding (3 steps: name/org type, address+geocode, food type chips)
- [ ] NGO onboarding (3 steps: org name/reg number, address+geocode, preferences+capacity+radius sliders)
- [ ] Auth guard in root layout (redirect to onboarding if no profile)
- [ ] Auto-verify NGO after 30s (demo mode)

## Donor App

- [ ] Dashboard: active listings horizontal scroll, stats strip, FAB
- [ ] List Food screen: name, category chips, qty slider, expiry picker, pickup window, photo upload (Supabase Storage), Smart Match toggle
- [ ] My Donations Feed: all listings, status pills, tap for detail
- [ ] Listing detail: NGO info, pickup schedule, Generate QR button
- [ ] NGO Map: OSM + blue pins, tap for NGO bottom sheet
- [ ] Impact Dashboard: FoodPrint stats (kg, CO2, water, meals), NGO partners list, milestone badges

## NGO App

- [ ] Dashboard: live urgent listings banner (Realtime), upcoming pickups, stats strip
- [ ] Browse Food: list + map toggle, filter bar, expiry color-coded cards
- [ ] Claim flow bottom sheet: qty slider, time picker within donor window, confirm
- [ ] Partial claim: decrement qty_remaining on listing, leave rest available
- [ ] Donor Map: OSM + color-coded pins (green/amber/red), tap to claim
- [ ] My Collections Feed: claim history, status, tap for donor detail
- [ ] Schedule Manager: calendar view, upcoming pickups, Scan QR button
- [ ] QR scan: expo-barcode-scanner, hit Express verify endpoint, mark claim completed
- [ ] Impact Dashboard: FoodPrint stats, donor partners, badges

## Express Backend

- [ ] `POST /api/match` — Smart Match scoring engine (distance 40%, pref match 30%, capacity 20%, urgency 10%)
- [ ] `POST /api/claims/verify` — validate QR token, mark claim completed
- [ ] `POST /api/notify` — send Expo push notifications (new listing, claim confirmed, pickup in 1h)
- [ ] `GET /api/impact/:userId` — FoodPrint calculation (CO2, water, meals, people)
- [ ] Nominatim proxy endpoint (rate-limited geocoding)

## Core Features

- [ ] Supabase Realtime subscription on listings (NGO dashboard live feed)
- [ ] Expiry urgency color system (green >4h, amber 1-4h, red <1h)
- [ ] QR code generation (react-native-qrcode-svg) on donor side
- [ ] QR scanning (expo-barcode-scanner) on NGO side
- [ ] Push notifications: new listing nearby, claim confirmed, pickup reminder T-1h, pickup verified
- [ ] Conflict detection: NGO cannot double-book overlapping pickup times
- [ ] Shareable FoodPrint card image generator

## Design + Polish

- [ ] Design system: theme.ts (colors, typography, spacing, shadows, border-radius)
- [ ] All screens consistent with white + sky blue palette, Inter/Google Sans
- [ ] Smooth animations: list items fade in, counters animate, tab transitions
- [ ] Loading states on all async operations
- [ ] Empty states (no listings, no claims)
- [ ] Onboarding screens fully polished
- [ ] Milestone badges UI
