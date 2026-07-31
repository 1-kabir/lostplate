# Lost Plate — Master Task List

## Project Setup

- [x] Init Expo project (managed workflow, Expo Router)
- [x] Init Express server (`server/` in monorepo)
- [x] Create Supabase project, grab URL + anon key — project exists; app's `.env` still has placeholder values, see Notes
- [x] Create GitHub repo, push initial scaffold
- [x] Deploy Express to Railway (free tier) — confirmed live and responding

## Supabase

- [x] Create `users` table — plus migration 001 adds onboarded, verification_status, diet_pref, registration_number
- [x] Create `listings` table
- [x] Create `claims` table
- [x] Write RLS policies (users own their data, NGOs read available listings)
- [x] Enable Realtime on `listings` and `claims`
- [x] Create impact views (`donor_impact`, `ngo_impact`) — server/routes/impact.js computes the same thing directly for robustness, views are there for reference
- [x] NEW: `create_claim()` RPC — atomic, row-locked claim reservation so two NGOs can never double-claim the same surplus kg
- [x] NEW: `listing-photos` storage bucket + policies for real photo upload
- [ ] ACTION NEEDED: run `server/migrations/001_auth_verification_and_claims.sql` in the Supabase SQL editor — nothing in this migration can be applied by an agent, no DB wire access from this sandbox

## Auth + Onboarding

- [x] Login screen — real Supabase Auth signUp/signIn (was previously a UI shell that never called Supabase at all)
- [x] Donor onboarding — real profile write on completion (name, org type, geocoded address, food prefs)
- [x] NGO onboarding — real profile write; also added a food-category chip step that was missing entirely, which silently broke Smart Match preference scoring for every NGO
- [x] Auth guard in root layout — now waits for real session restore before routing, persists session via AsyncStorage
- [ ] Auto-verify NGO after 30s (demo mode) — kept the existing manual "Approve & Enter App" demo button instead of a timer; verification status is now real and persisted (unsubmitted/pending/approved), just not auto-timed

## Donor App

- [x] Dashboard — real listings scoped to the signed-in donor, real stats
- [x] List Food screen — real Supabase insert, real photo upload to Storage, real Smart Match call showing suggested NGOs on publish
- [x] My Donations Feed — real data, correctly scoped by donor_id (was matching on name string before)
- [x] Listing detail + Generate QR — real react-native-qrcode-svg code encoding the actual claim's qr_token (was a hand-drawn fake QR graphic before)
- [x] NGO Map — real verified NGOs from Supabase, real distance calc, OpenStreetMap tiles on Android
- [x] Impact Dashboard — real FoodPrint stats from the new impact API (was 4 hardcoded numbers before)
- [ ] Milestone badges — not built (scope cut for time)

## NGO App

- [x] Dashboard — real live listings sorted by urgency, real stats
- [x] Browse Food — real data, fixed filter logic (partial-status listings now correctly stay browsable)
- [x] Claim flow — real atomic claim via the create_claim RPC, real donor notification on claim
- [x] Partial claim — qty reserved atomically at claim time under a DB row lock (old code would have double-decremented at pickup time on top of this)
- [x] Donor Map — real listings as pins, urgency color-coded, OpenStreetMap tiles on Android
- [ ] My Collections Feed — not built as a standalone screen; claim history exists in the data layer (claimStore) but there was never even a mock screen for this, and one wasn't added
- [x] Schedule Manager — real claims per day, real calendar week
- [x] QR scan — real camera scanning via expo-camera (not expo-barcode-scanner, which is being phased out in favor of Camera's built-in scanning), hits the real verify endpoint
- [x] Impact Dashboard — real FoodPrint stats
- [ ] Badges — not built (scope cut for time)

## Express Backend

- [x] `POST /api/match` — already real, untouched (correct Haversine + scoring)
- [x] `POST /api/claims/verify` — fixed a bug where qty_remaining_kg was decremented twice (once at claim time via the new RPC, once again here); now only marks completion and flips listing to collected when nothing is left
- [x] NEW: `POST /api/notify/register` + `POST /api/notify/send` — real Expo push delivery, wired into claim confirmation and pickup verification
- [x] NEW: `GET /api/impact/:userId` — real FoodPrint aggregation from completed claims
- [x] Nominatim proxy endpoint — already real, untouched, confirmed working live

## Core Features

- [x] Supabase Realtime subscription on listings and claims — both apps now update live with no refresh
- [x] Expiry urgency color system — now computed from a real expiry_at timestamp instead of a display-only string
- [x] QR code generation — real react-native-qrcode-svg on the donor side
- [x] QR scanning — real expo-camera scanning on the NGO side
- [x] Push notifications — new listing device registration, claim confirmed, pickup verified. NOT done: the T-1h pickup reminder, which needs a scheduled job (cron) the Express free-tier setup doesn't have yet
- [ ] Conflict detection for overlapping NGO pickup times — not implemented; the RPC prevents over-claiming quantity but doesn't check the NGO's own schedule for time overlaps across different listings
- [ ] Shareable FoodPrint card image generator — the share modal now shows real numbers, but "Share Image" still just closes the modal rather than invoking a native share sheet with a rendered image

## Design + Polish

- [x] Design system — theme.ts already matched the design guidelines exactly, no changes needed
- [x] All screens consistent with white + sky blue palette, Plus Jakarta Sans
- [x] Smooth animations — spring physics already built into Button/TypeToggle, untouched
- [x] Loading states — added to list-food, impact, claim-sheet, notifications; not exhaustively audited on every screen
- [x] Empty states — already existed, untouched
- [x] Onboarding screens fully polished — plus the new NGO food-category step matches the existing visual language
- [ ] Milestone badges UI — not built (scope cut for time)
