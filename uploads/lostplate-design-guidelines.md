# Lost Plate — Design Guidelines

## Why This Doc Exists

AI-generated UIs have a documented fingerprint: violet-to-indigo gradients, Inter as the only typeface, three equal feature cards, rounded-2xl on everything, fade-up-on-scroll, glassmorphism, and emoji as icons. Research across 10,000+ AI-generated UIs identifies these as the statistical center of LLM training data — they appear together, unchosen, because no design constraints were given.

Lost Plate must look like a decision was made. Every rule in this document is either something specific we want, or a deliberate block on an AI default.

The tone we are designing for: a clean, modern mobile app — friendly but not childish, structured but not cold, playful but not noisy. Think the calm confidence of a well-made consumer product. Light, airy, blue-sky energy.

## The Anti-AI Blacklist

These are banned. If any of these appear in the codebase, replace them.

**Colors**
- No purple, violet, or indigo anywhere — no #7c3aed, #6366f1, #4f46e5, #8b5cf6
- No blue-to-purple gradients, anywhere, ever
- No neon accents
- No cyan-on-dark (#38BDF8 on dark backgrounds)
- No gradient text (no -webkit-background-clip: text)
- No pure #FFFFFF on #F9FAFB (1:1 contrast — visually dead)

**Typography**
- No Inter. Not even as a fallback. The font is Plus Jakarta Sans, full stop.
- No using one font at the same weight for every text element
- No oversized headings that aren't earning their size

**Layout**
- No three-equal-cards grid as a default component pattern
- No centered layout for every screen — asymmetry is allowed, expected
- No sticky nav with backdrop-blur (solid backgrounds only)
- No max-w-7xl or hardcoded Tailwind max-widths
- No cards inside cards inside cards
- No wrapping every block of text in a card container

**Effects**
- No glassmorphism (backdrop-filter: blur)
- No glow shadows / drop-shadow on colored elements
- No soft floating blob backgrounds
- No rounded-2xl or rounded-3xl on everything — radius is varied by purpose

**Animation**
- No transition-all duration-300 ease-in-out
- No fade-up-on-scroll (opacity 0 + translateY 20 on mount)
- No scale-105 on every hover/press
- No every-element-animates approach

**Icons**
- No emoji as icons, ever
- No stock 3D illustrations

**Copy**
- No "Transform your workflow", "Unlock productivity", "Seamless experience", "Built for modern teams"
- Every string of copy in the app must be specific and human

## Color System

A custom palette built from scratch. None of these values appear in Tailwind defaults or shadcn.

```
/* Brand Blues — warm-shifted sky, not indigo */
--blue-50:   #EEF6FD   /* page canvas, almost white */
--blue-100:  #D6EBFA   /* light surfaces, input fills */
--blue-200:  #A8D4F5   /* borders, dividers */
--blue-300:  #70B8EE   /* secondary elements */
--blue-400:  #3E9BD5   /* primary brand — sky blue, NOT Tailwind blue-500 */
--blue-500:  #2280BC   /* CTAs, active states */
--blue-600:  #1A6799   /* deep brand, pressed states */

/* Neutral Ramp — warm white, not sterile grey */
--neutral-0:  #FAFCFE   /* screen background — blue-tinted white, not pure #fff */
--neutral-50: #F2F7FC   /* card surfaces */
--neutral-100:#E4EDF6   /* hover states, subtle borders */
--neutral-200:#C8D8E8   /* dividers */
--neutral-400:#7B96AE   /* placeholder text, muted */
--neutral-600:#3D5468   /* secondary text */
--neutral-900:#1A2B3C   /* primary text, headings */

/* Semantic */
--green:   #2EC47A   /* success, collected status */
--amber:   #F5A623   /* warning, expiring soon */
--red:     #E05B5B   /* urgent, expiring now */
--verified:#1A99A0   /* teal — NGO verified badge only */
```

**Usage rules:**
- Screen background: --neutral-0 always (the blue-white, not pure white)
- Cards sit on --neutral-50 with a 1px --neutral-100 border. No drop shadows on cards unless they are modals/sheets floating above content.
- --blue-400 is the brand color. Use it sparingly — FABs, active tab indicator, progress fill, primary CTA. It should feel like a reward when it appears.
- --blue-500 is for interactive states only (tapping, active)
- Status system is non-negotiable: green for Available/Collected, amber for Expiring, red for Urgent, neutral-400 for Expired. Do not invent other status colors.
- Never use blue on a blue surface. Always pair blue with white or neutral.
- The verified teal (--verified) is used only for the NGO verification badge. It must stay unique.

## Typography

**Font: Plus Jakarta Sans**
Available via @expo-google-fonts/plus-jakarta-sans. It is humanist, friendly, and distinctive — the right family for this product. Do not swap it for anything else.

```
/* Type Scale */
--text-xs:   12px / 1.5   weight 400   /* timestamps, fine print */
--text-sm:   13px / 1.5   weight 400   /* secondary labels */
--text-base: 15px / 1.6   weight 400   /* body text */
--text-md:   17px / 1.5   weight 500   /* card titles, section labels */
--text-lg:   20px / 1.4   weight 600   /* screen section headers */
--text-xl:   24px / 1.3   weight 700   /* page titles */
--text-2xl:  32px / 1.2   weight 700   /* dashboard hero number */
--text-3xl:  48px / 1.1   weight 800   /* FoodPrint impact counter */
```

**Rules:**
- Headings are tight (line-height 1.1–1.3). Body is airy (1.6). Never the same line-height everywhere.
- Letter spacing on large headings: -0.5px to -1px. This is deliberate. AI never sets negative tracking.
- Weights used: 400 (body), 500 (labels), 600 (section titles), 700 (page titles), 800 (hero numbers only). Picking the right weight for each context is the job.
- --neutral-900 for primary text. --neutral-600 for secondary. --neutral-400 for placeholder/disabled. Never use pure black (#000) for text.
- Numbers on impact screens: weight 800, letter-spacing -1px, color --blue-500. This is the moment of punch — give it room.
- Status pill text: 11px, weight 600, letter-spacing 0.4px (all-caps labels use wider tracking).

## Spacing & Layout

**Base unit: 4px.** All spacing is a multiple of 4.

```
spacing scale:
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
```

**Screen padding:** 20px horizontal on all screens. Not 16, not 24 — 20. This is a deliberate choice that differs from Tailwind's p-4 (16) and p-6 (24) defaults.

**Card padding:** 16px internal. Cards are not bento boxes — content inside them should breathe but not feel sparse.

**Section spacing:** 32px between major sections within a screen. 20px between a section label and its content.

**Layout principles:**
- Not everything is centered. Dashboard items align left — left-aligned content reads faster and feels more native to mobile.
- Use asymmetry deliberately: a stat strip with 3 unequal columns feels designed; 3 equal columns feels generated.
- The FAB (Floating Action Button) has a 20px margin from the bottom safe area and 20px from the right edge. It does not obscure the bottom tab bar.
- Bottom sheets have a 24px top handle, 20px internal padding, and a 16px border radius on top corners only.
- Map screens: map fills the full viewport. Controls float above the map as 40px pill buttons with white fill and --neutral-200 border. No opaque overlays on the map.

**Max widths:** None. This is a mobile app. Width is the device width minus 40px horizontal padding.

## Component Vocabulary

Each component type has one border-radius value. Mixing radii randomly is an AI tell.

```
Component         Radius     Shadow
─────────────────────────────────────────────────
Screen cards      12px       none — border only (1px neutral-100)
Modal / sheets    16px top   medium: 0 -4px 24px rgba(26,43,60,0.10)
FAB               100px      subtle: 0 4px 16px rgba(26,43,60,0.12)
Input fields      10px       none — border only
Status pills      100px      none
Primary button    12px       none
Map controls      20px       subtle
Image crops       12px       none
Avatar            100px      none
```

**Food Card anatomy:**
- 12px radius, 1px --neutral-100 border, --neutral-50 fill
- Left edge: 3px colored bar (green/amber/red per urgency) — this is the urgency signal, subtle and intentional
- Top: food name (text-md, weight 600) + category chip (pill, text-xs)
- Middle: qty in kg (text-xl, weight 700, --blue-500) + donor/ngo name (text-sm, neutral-600)
- Bottom: distance + time remaining, right-aligned
- No icons used as decoration. Icons are used for function only.

**Status pill anatomy:**
- 100px radius, 6px vertical padding, 12px horizontal padding
- Background is a 12% opacity tint of the status color
- Text is the full status color at weight 600, 11px, letter-spacing 0.4px
- Four states: Available (green), Expiring (amber), Urgent (red), Collected (blue-200/blue-500 text), Expired (neutral-100/neutral-400 text)

**Primary Button:**
- Background: --blue-400, pressed: --blue-500
- 12px radius, 56px height, full width
- Text: 16px, weight 600, white, letter-spacing 0.1px
- No shadow. Tap state compresses scale to 0.97 with spring easing.
- No gradient on buttons — ever.

**Stat card (dashboard strips):**
- Three stats in a row — but NOT equal weight. Primary stat is wider or larger type.
- Label above, number below. Number is --text-xl or --text-2xl, weight 700.
- Background: --blue-100. Border: none. No drop shadow.

**Bottom tab bar:**
- Background: white (#FAFCFE), 1px --neutral-100 top border
- Active icon + label: --blue-400
- Inactive: --neutral-400
- No background highlight bubble behind active icon (that is an AI default)
- Labels always visible (not hidden on mobile)

## Motion & Animation

Animations in Lost Plate serve one purpose: to communicate state change. They do not exist to make things feel "dynamic" or "alive". Every animation must justify its existence.

**Spring physics (not linear/ease-in-out):**
```
fast spring:    tension 400, friction 30   /* button press, pill change */
standard spring:tension 280, friction 26   /* card appear, sheet open */
slow spring:    tension 200, friction 24   /* counter animate, page enter */
```
Use React Native Reanimated withSpring() — not Animated.timing().

**Specific animations that are allowed:**

1. Button press: scale 1.0 -> 0.97, fast spring. Gives tactile feedback.
2. FAB on screen load: scale 0.8 -> 1.0, standard spring, 50ms delay. One element only.
3. Impact counter: count up from 0 on screen mount. Standard spring interpolation. This earns the animation.
4. New listing card appears (realtime): slide in from right edge + fade in. Duration 220ms, standard spring. Not from below — lateral entry feels app-native.
5. Bottom sheet open: translateY from off-screen, slow spring. Standard sheet behavior.
6. Status pill transition: background color crossfade over 180ms.
7. Tab switch: content fades (opacity only), 150ms. No translate on tab switch.

**What is explicitly not allowed:**
- Fade-up on scroll (opacity 0 + translateY 20 on mount)
- Every list item staggering in on load
- Parallax on scroll
- Continuous looping animations (pulsing dots, spinning badges)
- Skeleton loaders that "shimmer" via gradient animation (use static placeholder fill instead)
- Scale-105 on press for cards (use opacity 0.85 instead — more native-feeling)

**Reduced motion:** Always check AccessibilityInfo.isReduceMotionEnabled(). If true, skip all transforms and use opacity-only transitions at 100ms.

## Shadows, Borders & Depth

Depth in this app is communicated through color value and border, not through shadows. Shadows are reserved for two cases: floating UI (sheets, FABs, modals) and the map controls.

```
/* Shadow tokens — only these three, nothing else */
--shadow-float:  0 8px 32px rgba(26, 43, 60, 0.12);  /* sheets, FAB */
--shadow-map:    0 2px 12px rgba(26, 43, 60, 0.10);  /* map control pills */
--shadow-modal:  0 16px 48px rgba(26, 43, 60, 0.18); /* full modals */
```

**Cards use borders, not shadows.**
A 1px border of --neutral-100 on a --neutral-50 background is cleaner and less AI than shadow-md on white. The contrast between the --neutral-0 canvas and the --neutral-50 card is perceptible and sufficient.

**Elevation is communicated by color value:**
- Canvas: --neutral-0 (lightest)
- Card surface: --neutral-50
- Input fill: --neutral-50
- Active/selected card: --blue-50 fill, 1px --blue-200 border
- Bottom sheet: white (#FAFCFE), shadow-float on top edge
- Modal overlay: rgba(26,43,60,0.4) scrim

**What not to do:**
- No shadow-md or shadow-lg on every card
- No colored shadows (blue-tinted drop shadow behind blue elements)
- No glow effects
- No nested surfaces with increasing shadow depth

## Iconography

**Icon set: react-native-vector-icons / @expo/vector-icons (Feather or Phosphor)**

Phosphor Icons is preferred — it has regular and bold weights that match the font weight system.

**Sizing:**
- Navigation tab icons: 24px
- In-card functional icons: 18px
- Inline text icons: 16px
- Empty state icons: 48px, --neutral-200

**Color:**
- Active / brand: --blue-400
- Inactive / secondary: --neutral-400
- Destructive: --red
- On blue backgrounds: white
- In empty states: --neutral-200

**Rules:**
- Icons are used for function, not decoration. A card title does not need a leading icon.
- No icon + colored circle background chips (the "rounded-full bg-blue-100 p-2" AI pattern)
- No emojis as icons anywhere in the app
- Map pins are custom components (colored circle with a small food-type icon inside), not default map pins
- The app logo/wordmark is type-based. No food emoji or generic fork/leaf icon as the app icon.

## Screens Reference — Tone & Feel

Each screen has a distinct moment. These notes ensure every screen feels intentional.

**Login screen:**
Two large toggle buttons at the top (Donor / NGO) — full width, 64px tall, 12px radius. The active one fills --blue-400 with white text. The inactive one is --neutral-50 with --neutral-600 text. Clean and binary. Below, standard email/password fields. One primary CTA. No hero illustration, no tagline, no gradient background. The brand color doing the work of identity is enough.

**Onboarding steps:**
Progress indicator is a thin 2px line at the top of the screen, filling left to right. Not dots — a line is quieter. Each step has a large question at the top (text-xl, weight 700) and input/selection below. Generous whitespace. The step feels like a conversation, not a form.

**Donor Dashboard:**
Starts with a greeting (first name only, text-lg, weight 500, --neutral-600 — subdued, not hero). Below: a horizontal scroll of active food cards. Then a stat strip. The FAB is always visible, --blue-400, with a plus icon. This is the most-used screen — it must load fast and feel light.

**NGO Dashboard:**
The live feed of available food is the hero. A banner at the top pulses once on new listing arrival (NOT continuously). Cards are sorted by urgency — the left edge bar communicates this immediately. The screen should feel like a live tool, not a gallery.

**Map screens:**
Full-bleed map. Control strip at the bottom (a white pill with filter chips). Pin tap triggers a bottom sheet from below. The map is the UI — do not overlay it with containers or gradients.

**FoodPrint / Impact screen:**
This is the emotional payoff screen. Large number, animated, --blue-500, weight 800. Below: a grid of smaller stats. Below that: a horizontal scroll of donor/NGO partner avatar chips. Restrained, not celebratory — the data speaks. One shareable card CTA at the bottom.

**QR code modal:**
Full-screen modal, white background. QR code centered, large (240x240). Donor name + food name above. Expiry below. One close button top-left. Nothing else. Clean, functional, unmistakable.

## Things That Make It Beautiful

These are the specific craft details that separate the app from AI slop. Each one is a small decision that signals a human made this.

1. **The left-edge urgency bar on food cards.** 3px, flush left, colored by urgency. No other design uses this for food apps. It is immediately legible and non-intrusive.

2. **Negative letter-spacing on large numbers.** -0.5px to -1px on impact counters and hero stats. This one line of style makes numbers look typeset, not defaulted.

3. **The onboarding progress line, not dots.** A 2px full-width line filling left to right is quieter and more sophisticated than paging dots.

4. **Spring physics on button press.** Not ease-in-out at 300ms. A fast spring that overshoots slightly and settles — it feels physical.

5. **Neutral-0 canvas vs. white cards.** The screen background is #FAFCFE (blue-tinted white). Cards are #F2F7FC. The difference is barely there — but it reads as designed, not defaulted.

6. **Status pills with 12% opacity background.** Rather than a flat fill, the pill background is the status color at 12% opacity. Feels light, modern, not chunky.

7. **Stat strip with unequal column widths.** The primary stat is given more horizontal space. This signals hierarchy — a human looked at the content and decided what mattered most.

8. **Map pins as custom components.** Not the default red teardrop. A 36px circle in the urgency color, 2px white border, with a small category icon inside at 16px. Elegant and branded.

9. **The QR modal is completely empty except the QR.** Restraint as design. Nothing competes.

10. **No loading spinners — skeleton fills.** Static placeholder fills (not animated shimmer gradients) while data loads. Calm, not anxious.
