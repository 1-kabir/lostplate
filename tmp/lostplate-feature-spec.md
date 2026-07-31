# Lost Plate — Feature Spec

## Elevator Pitch

**"Turning Excess Into Impact"**

Lost Plate is a real-time food rescue platform connecting surplus food from donors (restaurants, hotels, households, caterers) to verified NGOs — before it spoils, and before someone goes hungry.

1/3 of all food produced globally is wasted. 800M+ people are food insecure. The gap isn't supply — **it's coordination.** Lost Plate is the coordination layer.

**SDG Primary:** SDG 2 (Zero Hunger) + SDG 12 (Responsible Consumption & Production)
**SDG Secondary:** SDG 11 (Sustainable Cities), SDG 13 (Climate Action), SDG 17 (Partnerships)

**Judging Criteria Map:**
| Criterion | How Lost Plate wins it |
|---|---|
| UI/UX | Bespoke white+blue aesthetic, buttery UX, onboarding flows |
| Core Functionality | Realtime listings, smart matching, scheduling, QR pickup verification |
| Deployability | Expo EAS build, Express on Railway/Render, Supabase free tier — all live |
| Theme Relevance | Dual SDG impact, every feature mapped to real-world outcome |
| Pitch | Gut-punch stat → live demo → FoodPrint impact score |
| Innovation | AI Smart Match engine, FoodPrint™ metric, QR verification loop |

## Tech Stack

```
Mobile App       React Native + Expo (managed workflow, Expo Router)
Backend API      Node.js + Express (deployed on Railway or Render free tier)
Database         Supabase (Postgres + Auth + Realtime + Storage)
State Mgmt       Zustand
Maps             react-native-maps + OpenStreetMap tiles (Nominatim geocoding)
Notifications    Expo Push Notifications (via backend)
Fonts            Inter (Google Fonts via expo-font)
Icons            @expo/vector-icons
Image Upload     Supabase Storage (direct from app)
QR Code          expo-barcode-scanner + react-native-qrcode-svg
```

**Architecture Flow:**
```
App  ──►  Express API  ──►  Supabase DB
           │                    │
           ├─ Smart Match logic  ├─ Realtime subscriptions (listings, claims)
           ├─ Impact calc        ├─ Auth (JWT)
           ├─ Push notif proxy   └─ Storage (food photos)
           └─ Nominatim proxy
```

**Why Express backend instead of just Supabase Edge Functions:**
- Smart Match algorithm lives here (too complex for edge)
- Push notification batching
- Impact calculation engine
- Centralized Nominatim rate limiting
- Easy to demo as deployed URL

## Folder Structure

```
lostplate/
├── app/                         # Expo Router screens
│   ├── (auth)/
│   │   ├── index.tsx            # Login/signup toggle
│   │   ├── donor-onboard.tsx
│   │   └── ngo-onboard.tsx
│   ├── (donor)/
│   │   ├── _layout.tsx          # Bottom tab nav
│   │   ├── index.tsx            # Dashboard
│   │   ├── donations.tsx        # My Donations Feed
│   │   ├── map.tsx              # NGO Map
│   │   └── impact.tsx           # FoodPrint stats
│   ├── (ngo)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Dashboard
│   │   ├── browse.tsx           # Browse Food
│   │   ├── map.tsx              # Donor Map
│   │   ├── schedule.tsx         # Schedule Manager
│   │   └── impact.tsx
│   └── _layout.tsx              # Root layout + auth guard
│
├── components/
│   ├── ui/                      # Design system atoms
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Slider.tsx
│   │   └── StatCard.tsx
│   ├── FoodCard.tsx
│   ├── ClaimSheet.tsx           # Bottom sheet for claim flow
│   ├── QRModal.tsx
│   └── ImpactCounter.tsx        # Animated number counter
│
├── lib/
│   ├── supabase.ts              # Supabase client init
│   ├── api.ts                   # Express API calls
│   └── utils.ts                 # Haversine, expiry calc
│
├── store/
│   ├── authStore.ts             # Zustand: user session
│   └── listingStore.ts
│
├── constants/
│   └── theme.ts                 # Colors, fonts, spacing
│
└── server/                      # Express backend
    ├── index.js
    ├── routes/
    │   ├── match.js             # Smart Match engine
    │   ├── claims.js            # QR verify endpoint
    │   ├── notify.js            # Push notifications
    │   └── impact.js            # FoodPrint calc
    └── lib/
        ├── supabase.js
        └── scoring.js           # Match scoring algorithm
```

## User Types & Auth

**Login screen:** Single screen, two prominent toggle cards — "I'm a Donor" / "I'm an NGO". Different tints, same clean layout. Supabase Auth (email+password for MVP).

---

### Donor Onboarding (3 steps, skip-able after step 1)
1. Name + org type (Individual / Restaurant / Hotel / Caterer / Other)
2. Address → auto-geocode via Nominatim
3. What do you usually have? (chips: Cooked Meals / Raw Produce / Packaged Goods / Beverages / Bakery)

### NGO Onboarding (3 steps)
1. Org name + registration number (shown as "Pending Verification" badge until demo auto-approves)
2. Address → auto-geocode
3. Preferences: Veg / Non-Veg / Both + max capacity (kg/day slider) + pickup radius (km slider)

**Verification:** For demo, all NGOs auto-verified after 30s (simulated). In production, admin panel reviews reg number.

## Donor App — Screens

**Bottom tab nav:** Home · Donations · Map · Impact

---

### 1. Home (Dashboard)
- Greeting + "You've saved X meals this month" hero card (sky blue gradient)
- Active listings section: horizontal scroll of food cards (name, qty, status pill, time remaining)
- Status pills: `Available` (green) · `Claimed` (amber) · `Collected` (blue) · `Expired` (grey)
- FAB: **+ List Food** (bottom right, sky blue)
- Notification bell → push notification history

### 2. List Food (Modal / Full Screen)
- Food name (text input)
- Category picker: chips (Cooked / Raw / Packaged / Bakery / Beverages)
- Quantity slider: 1–100 kg (haptic feedback)
- Expiry window: `Now` / `Within 2h` / `Within 6h` / `Today` (segmented control)
- Pickup window: start time + end time pickers
- Optional photo (tap to add, Supabase Storage upload)
- Smart Match toggle: "Auto-suggest best NGO" (calls backend match engine)
- Submit → listing goes live, nearby NGOs notified in realtime

### 3. My Donations Feed
- All listings, newest first
- Card: food name, qty, category icon, status, NGO name (if claimed), time listed
- Tap → Detail: full info + assigned NGO contact + pickup schedule
- On claimed listing: **Generate QR** button → QR code for pickup verification
- Ability to cancel if not yet claimed

### 4. NGO Map
- OSM base map, blue pins = verified NGOs in area
- Tap pin → bottom sheet: NGO name, capacity, distance, food preferences, "Message" CTA
- Toggle: show only NGOs that match current listing's food type

### 5. Impact Dashboard (FoodPrint™)
- Hero number: **Total kg rescued** (large, animated counter)
- Stats grid: Meals Enabled · CO₂ Saved (kg) · Water Saved (L) · Days Active
- Formula shown subtly: 1kg food = 2.5kg CO₂, 1kg = ~3 meals
- NGO partners list (avatar + name + kg received)
- Shareable card generator: "I've rescued Xkg with Lost Plate 🌱" → share image
- Milestone badges: First Loop · 10kg Club · 100kg Hero

## NGO App — Screens

**Bottom tab nav:** Home · Browse · Map · Impact

---

### 1. Home (Dashboard)
- Greeting + "X new donations near you" live banner (Supabase realtime)
- Urgent listings section: red/amber cards sorted by expiry (expiring soonest first)
- Upcoming pickups section: confirmed schedules for today
- Quick stats strip: Total Collected · Meals Served · People Reached
- Notification bell

### 2. Browse Available Food
- **List/Map toggle** at top
- Filter bar: Distance (km) · Food Type · Qty (min kg) · Urgency
- List view: cards with donor name, food, qty available, distance, expiry badge, urgency color border
- Urgency border: 🟢 >4h · 🟡 1–4h · 🔴 <1h
- Tap card → Detail screen:
  - Full food info + donor name + photo (if provided)
  - Pickup window set by donor
  - **Claim** button

### 3. Claim Flow (Bottom Sheet)
- "How much would you like?" → slider (1kg to full qty_remaining)
- "When will you pick up?" → time picker within donor's window
- Preview: your claim summary
- Confirm → donor gets push notification, pickup locked in schedule
- If qty < total: remaining stays live for other NGOs (partial claim)

### 4. Donor Map
- OSM base map
- Color-coded pins: green (fresh >4h) · amber (expiring 1-4h) · red (urgent <1h)
- Cluster view when zoomed out
- Tap → bottom sheet with listing summary + Claim button
- My location pin (blue)

### 5. My Collections Feed
- All claims history, sorted newest first
- Status: Scheduled · Completed · Cancelled
- Tap → detail with donor info, food, qty, scheduled time
- Completed items show QR scan confirmation timestamp

### 6. Schedule Manager
- Calendar view (week default)
- Each pickup = a card on the timeline: food name, donor, qty, time
- Tap → donor contact (phone number shown)
- **Scan QR** button → opens camera to scan donor's QR code → marks pickup as Completed

### 7. Impact Dashboard (FoodPrint™)
- Total kg collected (animated)
- People fed estimate · CO₂ offset · Water saved
- Donor partners list
- Community milestone: org-wide rank if multiple NGOs in system
- Badges: First Collection · 50kg Rescuer · Community Champion

## Core Features

### 1. Realtime Listing Feed
Supabase Realtime subscriptions on `listings` table. NGOs within radius receive instant in-app notification when new food is listed. No polling, no delay.

---

### 2. Smart Match Engine (Innovation ⭐)
Express backend endpoint: `POST /api/match`
When a donor lists food, the engine scores every verified NGO in the DB:

```
Score = (1/distance_km × 0.4) + (preference_match × 0.3) + (capacity_headroom × 0.2) + (urgency_bonus × 0.1)
```

Returns top 3 suggested NGOs. Donor sees "Suggested for you" NGO cards on listing confirmation.
This is the innovation angle — no other food rescue app does intelligent matching, they all use simple proximity.

---

### 3. Scheduling System
- Donor sets pickup window (e.g., 2 PM – 6 PM)
- NGO picks a specific time within that window
- Conflict detection: NGO can't claim overlapping pickup times
- Both parties get push notification at T-1h before pickup
- Schedule stored in `claims` table, surfaced in both apps' Schedule screens

---

### 4. QR Pickup Verification (Innovation ⭐)
- On a confirmed claim, donor's app generates a unique QR code (encoded: claim_id + token)
- At pickup, NGO scans QR via `expo-barcode-scanner`
- Express API validates token → marks claim as `completed`
- Both sides see "Verified" status — builds trust, prevents fraud
- This creates a closed loop: List → Claim → Schedule → Verify → Impact logged

---

### 5. FoodPrint™ Impact Score (Innovation ⭐)
Proprietary metric calculated on the backend. Formula:

```
CO₂ saved (kg)   = kg_rescued × 2.5
Water saved (L)  = kg_rescued × 1000
Meals enabled    = kg_rescued × 3
People reached   = meals_enabled / 3
```

Shown on both dashboards with animated counters. Shareable card generated as an image.
Judges love a concrete metric — this makes impact tangible and memorable.

---

### 6. Push Notifications (Expo Push API)
Triggered from Express backend:
- NGO: "New donation near you — 15kg cooked meal, expires in 2h" 
- Donor: "Your donation was claimed by [NGO name]"
- Both: "Pickup in 1 hour — [food name] at [time]"
- Donor: "Pickup confirmed! Your food reached someone in need 🌱"

---

### 7. Partial Quantity Claiming
An NGO can claim 10 of 30 kg. `qty_remaining` decrements on `listings`. Remaining qty stays `available` for other NGOs. Prevents waste of the listing itself.

---

### 8. Design System
```
Background:    #FFFFFF (pure white)
Primary:       #60B8E0 (sky blue)
Light surface: #E8F4FD (pale blue)
Accent:        #3A9BD5 (deeper blue for CTAs)
Text:          #1A1A2E (near black)
Muted:         #8A95A3
Success:       #4CAF82 (soft green)
Warning:       #F9A825 (amber)
Danger:        #E05C5C (soft red)
Font:          Inter (300/400/500/600/700)
Border radius: 16px cards, 12px inputs, 100px pills
Shadow:        subtle drop shadow, no harsh borders
```

## Data Models (Supabase)

```sql
-- Users table (both donors and NGOs)
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  type text CHECK (type IN ('donor','ngo')),
  name text,
  org_type text,           -- donor: Individual/Restaurant/Hotel/etc
  address text,
  lat float8,
  lng float8,
  food_prefs text[],       -- NGO: ['veg','non-veg']
  max_capacity_kg int,     -- NGO only
  pickup_radius_km int,    -- NGO only
  verified boolean DEFAULT false,
  expo_push_token text,
  created_at timestamptz DEFAULT now()
)

-- Food listings
listings (
  id uuid PRIMARY KEY,
  donor_id uuid REFERENCES users(id),
  food_name text,
  category text,           -- cooked/raw/packaged/bakery/beverages
  qty_kg int,
  qty_remaining_kg int,
  expiry_window text,      -- 'now'/'2h'/'6h'/'today'
  expiry_at timestamptz,   -- computed from expiry_window
  photo_url text,
  status text DEFAULT 'available',  -- available/partial/fully_claimed/collected/expired
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  lat float8,
  lng float8,
  created_at timestamptz DEFAULT now()
)

-- Claims (NGO claiming a listing)
claims (
  id uuid PRIMARY KEY,
  listing_id uuid REFERENCES listings(id),
  ngo_id uuid REFERENCES users(id),
  qty_claimed_kg int,
  pickup_time timestamptz,
  status text DEFAULT 'confirmed',  -- confirmed/completed/cancelled
  qr_token text UNIQUE,   -- for QR verification
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
)

-- Impact stats (computed view or materialized)
CREATE VIEW impact_stats AS
SELECT 
  user_id,
  SUM(qty_kg) as total_kg,
  SUM(qty_kg) * 2.5 as co2_saved_kg,
  SUM(qty_kg) * 1000 as water_saved_l,
  SUM(qty_kg) * 3 as meals_enabled,
  MIN(created_at) as member_since
FROM ...
```

**Supabase RLS Policies:**
- Users can only read/write their own profile
- Listings: donors own theirs; NGOs can read `available` listings within radius
- Claims: NGOs own theirs; donors can read claims on their listings
- Realtime enabled on `listings` (for NGO feed), `claims` (for donor updates)

## Hackathon MVP Scope

Build in this exact order. Each milestone is demo-able.

---

**MILESTONE 1 — Shell + Auth** *(~2h)*
- Expo project init, folder structure, navigation setup
- Supabase project + users table + auth
- Login screen (donor/NGO toggle)
- Onboarding flows (3 steps each)
- Tab navigators for both user types

**MILESTONE 2 — Core Loop** *(~3h)*
- Express server init (Railway deploy)
- List Food screen (donor) → inserts to Supabase
- Browse Food screen (NGO) → reads listings
- Claim flow with qty slider
- Scheduling (pickup time picker, store in claims)
- Basic dashboards showing active listings/claims

**MILESTONE 3 — Maps + Realtime** *(~2h)*
- OSM map on both apps (react-native-maps)
- Nominatim geocoding on address input
- Supabase Realtime subscription on listings (NGO gets live updates)
- Expiry color coding on cards

**MILESTONE 4 — Innovation Features** *(~2h)*
- Smart Match engine on Express (scoring algorithm)
- QR code generation (donor) + scanning (NGO)
- FoodPrint™ impact stats page with animated counters
- Push notifications via Expo API

**MILESTONE 5 — Polish** *(~1h)*
- Design system applied consistently (colors, fonts, shadows, border radius)
- Onboarding screens polished
- Loading states, empty states
- Shareable impact card

---

**Total: ~10h focused build**

**P0 (non-negotiable for demo):** M1 + M2 + maps
**P1 (strong for judges):** M3 + impact stats + QR
**P2 (if time allows):** Push notifications + shareable card + badge system

## Pitch Angle

**Hook (10 seconds):** "Every day, enough food is wasted to feed every hungry person on the planet — twice. The food exists. The people exist. What's missing is the loop."

**Problem:** 1/3 of food produced globally = wasted. 828M people face food insecurity. Existing solutions are call-based, slow, and informal. No closed loop. No accountability.

**Solution:** Lost Plate — a real-time mobile platform where surplus food is listed in under 60 seconds, intelligently matched to verified NGOs, scheduled for pickup, and verified on collection. Every step logged. Every meal counted.

**Live Demo Flow:**
1. Donor lists 20kg biryani, sets 3–7 PM window → Smart Match suggests 2 NGOs
2. NGO sees live notification, claims 15kg, picks 4 PM
3. Donor sees "Claimed" status, generates QR
4. NGO scans QR at pickup → both see "Verified ✓"
5. FoodPrint™ updates: +15kg rescued, +37.5kg CO₂ saved, +45 meals enabled

**Innovation (for judges):** Three things no other app does: (1) Smart Match scoring engine, (2) QR-based closed-loop verification, (3) FoodPrint™ environmental impact metric. These aren't features — they're the architecture of trust.

**Scalability Story:** Every city has restaurants closing with unsold food and NGOs unable to find it. Lost Plate is city-agnostic infrastructure. Deploy in Mumbai today, Nairobi tomorrow.

**Closing line:** "Lost Plate doesn't solve hunger. But it dissolves the invisible wall between a restaurant's surplus and a family's empty plate. Code against collapse — one loop at a time."
