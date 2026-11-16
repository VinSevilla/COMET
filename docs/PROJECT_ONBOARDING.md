# COMET — Project Onboarding

> **Audience:** the COMET developer coming back after time away, and any AI development copilot joining the project. Assumes no prior knowledge of the codebase.
>
> **Snapshot:** written 2026-11-06 from the `main` branch at commit `e9918bf` ("update profile card ui", 2026-06-08). Working tree was clean. 67 commits total.
>
> **How to read the confidence labels used below**
> - **Verified**: read directly in the code, or produced by running a tool (`tsc`, `expo lint`, `git`).
> - **Inferred**: a reasonable conclusion from the code that I could not confirm. This usually means it depends on the Supabase database, which is **not** in this repository.
> - **Unknown**: can't be determined from the repo at all.

---

## 0. The Five-Minute Version

**What COMET is:** a React Native (Expo) dating app for iOS and Android. Its tagline is *"One Match at a Time."* The core idea is exclusive, focused dating. You send a **Signal** to someone. If they Signal back, you **Collide**. You then enter an **Orbit**, a chat phase where you focus on that one person. You can **Drift** (end it) at any time.

**Where it stands:** an early working prototype.
- **Polished:** the account and onboarding experience. It has 15 steps, animations, photo upload to cloud storage, and a profile preview with editing.
- **Rough:** the dating loop (discover → match → chat). Parts of it are styled and parts are still plain.
- **Not built yet:** the "one at a time" exclusivity that defines the product. Today it is only explained in copy.

**The three things to know first:**
1. **Matching is probably broken in the live app.** The current discovery tab ([Explore.tsx](../screens/Explore.tsx)) writes Signals using different column names than the older screen that created matches ([Browse.tsx](../screens/Browse.tsx)). It also never checks whether the Signal is mutual. Browse is no longer reachable from the tab bar, so as the code reads, no new Collisions can be created. *(Verified in code. Whether the insert itself succeeds depends on the database schema, which is Unknown.)*
2. **The "Verified" photo badge can be faked.** "Take live photo (Verified)" actually opens the photo library. The code has a `REPLACE:` comment saying so. Any library photo picked through that option gets a Verified badge. *(Verified.)*
3. **The database is not in the repo.** There are no SQL files, migrations, or Row Level Security (RLS) policies under version control. Everything about tables, columns, and access rules is inferred from the queries in the app.

**Suggested next step:** fix the core loop before adding features. That means three things: (a) export the Supabase schema into the repo, (b) make Explore create Collisions correctly, and (c) route users who are signed in without a profile back into onboarding. See §13.

---

## 1. Project Overview

### What problem COMET is trying to solve
Mainstream dating apps encourage endless swiping and keeping many low-effort conversations going at once. COMET's answer (from the in-app copy and the roadmap PDF in `../COMET Images/`) is **exclusivity and intention**: focus on one connection at a time, learn about people through prompts and values, and leave gracefully when it's not working.

### The core dating experience (as designed)
From the final onboarding screen ([Onboarding.tsx, step 14](../screens/Onboarding.tsx#L2354)):

> "COMET is built around one idea: **One match at a time.** If you're interested in someone, send them a **Signal**. When you and someone both signal each other, a **Collision** occurs. You enter **Orbit** — an exclusive chat phase where discovery pauses and you focus on one connection. You can **Drift** anytime. No pressure."

The roadmap PDF adds ideas that are **not implemented**: a locked discovery queue while you're in a Collision, a 7-day countdown per match, push notifications, read receipts, an 18+ age gate, and photo reporting and moderation.

### Current stage
**Prototype / pre-alpha.** Verified evidence:
- Auth, onboarding, profile display, discovery display, and chat are all wired to a real Supabase backend.
- Exclusivity, preference filtering, profile editing, settings, safety tools (block/report), and notifications don't exist.
- There are no tests, no CI, no EAS build config (`eas.json`), and no README specific to COMET.
- Activity: heavy development March 11 – April 8, 2026, then 4 commits on June 8, 2026, then nothing.

### The main user journey today
```
Welcome (video + music) → Create account (email/password)
  → 15-step onboarding → Profile saved to Supabase
  → Tab bar: [Profile] [Orbit] [Explore]
       Profile: see your own card, sign out
       Explore: one profile at a time → Pass or Signal ✦
       Orbit:   list of matches → tap → Chat (real-time) → Drift
```
The "→ Collision" step between Explore and Orbit is where the loop currently breaks (see §6).

---

## 2. App Identity and Product Philosophy

### Product personality
From the copy, naming, and visuals, COMET's personality is **calm, warm, a little cosmic, and non-pushy**. It uses a consistent space-exploration vocabulary:

| Concept | COMET term | Where |
|---|---|---|
| Like | **Signal** (✦) | Explore button, onboarding copy |
| Match | **Collision** | Match status "New Collision" |
| Active conversation | **Orbit** (with "levels") | Orbit tab, chat header |
| Unmatch | **Drift** | Chat header button |
| Discovery | **Explore** (🚀 icon) | Tab |
| Your profile | **Explorer Profile** | Eyebrow label on profile card |
| Prompts section | **Mission Log** | Profile card section label |

The tone avoids pressure ("You can Drift anytime. No pressure.", "Stay" vs "Drift" in the confirmation). The dating-intent options are all relationship-oriented: "A meaningful relationship", "Something that could grow into more", "Taking things slow", "Still figuring it out". There's no "something casual" option, which is a clear product stance.

### How the current app supports the philosophy (Verified)
- **One profile at a time, full scroll.** Explore shows a single complete profile you scroll through before acting. There are no swipe gestures. Pass and Signal are deliberate buttons.
- **Depth is required.** Onboarding requires at least **2 prompt answers** (max 3), at least 1 interest (max 5), lifestyle answers, school/work, and a dating intent.
- **Intent is highlighted.** The dating-intent pill on the profile card gets the "selected" teal-glow treatment, so it's the most visually important fact after name and age ([ProfileCard.tsx:352](../components/ProfileCard.tsx#L352)).
- **Human phrasing.** Lifestyle answers are shown as sentences ("Drinks socially", "Works full-time"), not raw labels.
- **Graceful endings.** Drift has a gentle confirmation, and the legacy Browse logic let drifted people reappear in discovery.
- **Trust foundations.** Community Guidelines, Safety Guidelines, Terms, and Privacy screens exist, and there's a photo-verification concept.
- **Calm onboarding.** Ambient music, slow fades, haptics, and an end-of-flow explanation of how COMET works.

### Where it does not yet support the philosophy
- **Exclusivity isn't enforced.** You can Signal unlimited people and have many Orbits at once. The Orbit tab is a list. Nothing pauses discovery. *(Verified: no code checks for an active Orbit.)*
- **No limits on Signals.** That's the "endless swiping" pattern COMET wants to avoid.
- **Preferences are ignored.** Gender preference, age range, and distance are collected but not used to filter Explore. Distance is not even saved (§6.2).
- **Passed profiles come back.** Pass isn't recorded, so everyone reappears the next time Explore mounts.
- **Appearance comes first.** Every card opens with a 480-px photo. Prompt answers are cut off at 3 lines (`numberOfLines={3}`), which works against "learning about someone beyond appearance".
- **No safety tools.** The Guidelines promise reporting ("Users can report profiles…"), but there is no report or block feature.
- **Verification can be spoofed** (see §0), which undermines trust.

---

## 3. Design Identity

### Design tokens
[constants/theme.ts](../constants/theme.ts) defines a small COMET design system. It sits next to leftover Expo template tokens (`Colors`, `Fonts`) that the tab bar still uses.

| Token | Value | Meaning |
|---|---|---|
| `deepSpaceBlue` | `#0F2A44` | base navy |
| `electricBlue` | `#2A7DE1` | primary action, links, loaders |
| `cosmicTeal` | `#3CF6D5` | glow, selected state, verified check |
| `cometOrange` | `#FFB347` | warm accent (policy headings, "New Collision", `cta` button) |
| `textPrimary` | `#EAF6FF` | near-white with blue tint |
| `textSecondary` | `#6A8FAF` | muted steel-blue labels |
| `glass` / `glassBorder` | `rgba(15,42,68,0.6)` / `rgba(255,255,255,0.1)` | frosted surfaces |
| `Typography` | h1, h2, button, body, caption | Montserrat-based |
| `Spacing` | 8 / 12 / 16 / 24 / 32 | defined but **never imported** (lint warning) |
| `Glow` | blue, teal, orange shadow presets | used by Button and Explore |

In practice, most screens **hardcode** their colors instead of importing tokens. Onboarding.tsx alone has 81 hex literals.

### Recurring visual patterns (Verified)
- **Background:** a vertical `LinearGradient` from `#164271` to `#000000`. It's copy-pasted in Login, SignUp, ForgotPassword, Onboarding, Profile, and Explore.
- **Primary gradient:** Electric Blue → Cosmic Teal, left to right, used on primary buttons, the onboarding progress bar, and the Signal button. It includes a subtle dark vignette overlay for depth.
- **Glow:** teal `shadowColor` glows on primary buttons, selected options, the intent pill, and focused inputs (blue glow and border on focus).
- **Typography:** Montserrat Regular and Bold, loaded in [app/_layout.tsx](../app/_layout.tsx). The style uses uppercase "eyebrow" labels with wide letter-spacing ("EXPLORER PROFILE", "MISSION LOG", "INTERESTS"), and the COMET wordmark has a letter-spacing of 6.
- **Surfaces and cards:** dark navy panels (`#0a1929`, `#0d1f33`, `#142c46`) with hairline borders (`rgba(255,255,255,0.07–0.16)`). The profile info panel overlaps the photo with 24-px rounded top corners.
- **Radii:** buttons are full pills (999). Chips are 20, inputs and cards 16, option rows 10.
- **Pills:** neutral navy pills for interests and gender, and a highlighted pill for dating intent.
- **Selected state (very consistent within onboarding):** blue-tinted fill `rgba(42,125,225,0.12)`, teal border at 35% opacity, a soft teal glow, and text that switches from grey to bold white.
- **Verified badge:** a "smoked-glass" chip with a teal check icon, overlaid on the photo.
- **Iconography:** a mix of Ionicons, MaterialIcons, and MaterialCommunityIcons, plus **text glyphs** used as icons (`←`, `✕`, `✓`, `↑`, `✦`, `+`).
- **Navigation:** Expo Router stacks with headers hidden, custom `←` back buttons, and a bottom tab bar with 3 tabs.

### Motion
All animation uses React Native's built-in `Animated` API and `LayoutAnimation`. **Reanimated is installed, but COMET code doesn't use it.**
- **Welcome:** looping muted space video, logo fade + slide-up, delayed button fade, and ambient music that fades in over 1 second and respects silent mode.
- **Button:** spring scale to 0.96 on press.
- **Onboarding steps:** fade + 18-px rise per step.
- **Chips and lifestyle options:** animated gradient fill on select.
- **Birthday picker:** drum-roll columns with a "bump" animation and haptic ticks.
- **Photo source sheet:** spring-up bottom sheet with a fading backdrop.
- **Prompt answer box:** expands with `LayoutAnimation`.
- **Preview edits:** after you edit a section in the preview, it pulses a teal highlight that fades out over 1.4 s.
- **Haptics:** on tab presses, age slider changes, and picker ticks.

### What reinforces the identity well
- The Welcome screen (video, wordmark, music) is the strongest expression of "premium, intimate, space-inspired".
- The onboarding flow and the profile card are visually coherent with each other. Code comments explicitly match the card's pills to onboarding's selected and unselected states. That is a sign of a deliberate design language.
- The naming (Signal, Collision, Orbit, Drift) is thematic without being cartoonish.

### What feels inconsistent
| Issue | Where |
|---|---|
| **Orbit list and Chat look like an earlier era:** pure black backgrounds, system font with `fontWeight: "bold"` (no Montserrat), flat greys (`#1a1a1a`, `#111`), no gradient or glow | [Collision.tsx](../screens/Collision.tsx), [Chat.tsx](../screens/Chat.tsx) |
| **Tab bar is the unstyled Expo template:** it follows the phone's light/dark mode, uses template tint `#0a7ea4`, and two of three icons are hardcoded `color="black"`, so they don't show active state and are nearly invisible on dark backgrounds | [app/(tabs)/_layout.tsx](../app/(tabs)/_layout.tsx) |
| App config says `userInterfaceStyle: "automatic"` and the root uses the light `DefaultTheme`, but every screen is hardcoded dark. The splash background is white in light mode | [app.json](../app.json), [app/_layout.tsx](../app/_layout.tsx) |
| Off-palette colors: `#3FC6D5` (looks like a typo for `#3CF6D5`), `#2AB6DC` (slider), `#888`/`#555`/`#aaa` greys, `#e85d4a` (sign-out red) | Collision, Browse, Onboarding, Profile |
| Naming drift: tab "Orbit", route `collision`, header "Orbits", file `Collision.tsx`. The empty state says "Signal someone in **Browse**", but Browse no longer exists in the UI | Collision.tsx:114 |
| Back buttons: text `←` almost everywhere, but an Ionicons chevron plus "Back" in PolicyScreen | various |
| Onboarding has its own `primaryButton` style (flat blue, radius 10) on the location step instead of the shared `Button` | Onboarding.tsx:2621 |
| The onboarding preview card (step 13) is a separate, near-duplicate implementation of `ProfileCard`, with slightly different pill styling | Onboarding.tsx:2095+ |
| Android adaptive-icon background `#E6F4FE` is the template default | app.json |

---

## 4. Tech Stack

| Layer | Technology (version) | Why it's here |
|---|---|---|
| Framework | **Expo SDK 54** on **React Native 0.81.5**, **React 19.1** | One codebase for iOS and Android. Expo handles native modules, config, and builds. The New Architecture is enabled (`newArchEnabled: true`). |
| Language | **TypeScript 5.9**, `strict: true` | Type safety. `npx tsc --noEmit` passes with **0 errors** (Verified). `App.js` is a leftover JS template file. |
| Navigation | **expo-router 6** (file-based routing, typed routes) on React Navigation 7 | The file path in `app/` *is* the URL/route. Typed routes give compile-time checks on `router.push("/…")`. |
| Compiler | React Compiler (experimental flag in app.json) | Automatic memoization. Experimental. |
| Styling | React Native `StyleSheet.create`, per-file; tokens in `constants/theme.ts`; `expo-linear-gradient` for gradients | No styling library (no Tailwind/NativeWind, no styled-components). |
| State | Local `useState`/`useRef` per screen; one React Context for auth | No global store (Redux, Zustand) and no data-fetching cache (React Query). |
| Backend | **Supabase** (`@supabase/supabase-js` 2.99) | Hosted Postgres database, auth, file storage, and real-time subscriptions in one service. |
| Auth | Supabase email + password; session stored with **expo-secure-store** (device keychain) | [lib/supabase.ts](../lib/supabase.ts) passes a SecureStore adapter so the login token is stored encrypted. |
| Database | Supabase Postgres: `profiles`, `signals`, `matches`, `messages`, `orbit_events` (inferred) | See §6. Schema is not in the repo. |
| Storage | Supabase Storage bucket **`profile-photos`** | Onboarding uploads photos here and stores the public URLs on the profile. |
| Real-time | Supabase Realtime (`postgres_changes` on `messages`) | New chat messages appear without refreshing. |
| Images | `expo-image-picker` (choose/crop at 3:4, quality 0.8); RN `Image` to display | `expo-image` is installed but **unused**. |
| Location | `expo-location` (foreground permission, one-time GPS reading) | Stored as lat/lng on the profile. Not yet used for anything. |
| Media | `expo-video` (Welcome background), `expo-audio` (Welcome music) | Atmosphere on the first screen. |
| Animation | RN `Animated`, `LayoutAnimation` | Reanimated 4 is installed and imported once in `_layout.tsx` (template), but COMET screens don't use it. |
| UI bits | `@miblanchard/react-native-slider` (age and distance sliders), `@expo/vector-icons`, `expo-haptics`, Montserrat fonts via `expo-font` | |
| Tooling | ESLint (`eslint-config-expo`). `expo lint` reports 2 errors (unescaped apostrophes) and 1 warning (unused `Spacing`) (Verified) | No tests, no Prettier config, no CI. |

**Dependencies that appear unused (Verified by searching imports in source folders):**
- `@shopify/react-native-skia`: 0 imports. This is a heavy native graphics library, so removing it would shrink the app and speed up builds. It was perhaps added for planned space effects. *(Inferred.)*
- `expo-image`: 0 imports.
- `expo-symbols`, `expo-web-browser`: only used by leftover template components that nothing renders.
- `react-native-gesture-handler`, `react-native-screens`, `react-native-worklets`, `react-dom`, `react-native-web`, `expo-constants`, `expo-linking`, `expo-system-ui`, `expo-splash-screen`: not imported directly, but they are **runtime or peer requirements** of Expo Router, Reanimated, or web support. **Keep these.**

---

## 5. Codebase Architecture

### Repository map
The git repo is the inner `COMET/COMET/` folder. The outer `COMET/` folder also holds `COMET Images/` (reference images, screenshots, and the build-roadmap PDF), which is not under version control.

```
COMET/                         ← git repo root (remote: github.com/VinSevilla/COMET)
├── app/                       ← ROUTES (Expo Router). Every file = a screen URL.
│   ├── _layout.tsx            ← Root: loads fonts, splash, AuthProvider, root Stack
│   ├── index.tsx              ← "/" → redirects to tabs or welcome based on session
│   ├── modal.tsx              ← template leftover, unused
│   ├── (auth)/                ← route group for signed-out / onboarding screens
│   │   ├── _layout.tsx        ← Auth guard: if signed in AND has profile → tabs
│   │   ├── welcome|login|signup|onboarding.tsx   ← 1-line re-exports of screens/*
│   │   ├── forgot-password.tsx ← full screen implemented inline (inconsistent)
│   │   └── terms|privacy|guidelines|safety.tsx  ← policy content → PolicyScreen
│   ├── (tabs)/                ← route group for the signed-in app
│   │   ├── _layout.tsx        ← Tab bar + guard: no session → welcome
│   │   ├── index.tsx          ← "Profile" tab → screens/Profile
│   │   ├── collision.tsx      ← "Orbit" tab → screens/Collision
│   │   └── explore.tsx        ← "Explore" tab → screens/Explore
│   └── chat/[matchId].tsx     ← dynamic route /chat/<id> → screens/Chat
├── screens/                   ← SCREEN IMPLEMENTATIONS (the real UI code)
│   ├── Welcome, Login, SignUp, Onboarding, Profile, Explore, Collision, Chat
│   ├── Browse.tsx             ← LEGACY discovery screen, not routed anymore
│   └── Settings.tsx           ← 9-line placeholder, not routed
├── components/
│   ├── ProfileCard.tsx        ← the shared profile view + ProfileData type
│   ├── PolicyScreen.tsx       ← shared layout for legal/safety pages
│   ├── ui/Button.tsx          ← shared COMET button (primary/secondary/cta)
│   ├── haptic-tab.tsx         ← template; used by the tab bar
│   └── themed-*, hello-wave, parallax-scroll-view, external-link,
│       ui/collapsible, ui/icon-symbol*   ← Expo template leftovers, unused
├── context/AuthContext.tsx    ← session/user provider + useAuth() hook
├── lib/supabase.ts            ← the single Supabase client
├── constants/theme.ts         ← COMET tokens + template Colors/Fonts
├── hooks/                     ← template color-scheme hooks only
├── assets/                    ← fonts, logos, welcome video (6.3 MB 4K) + music (3.2 MB)
├── ios/, android/             ← generated native projects (from `expo run:*`/prebuild)
├── dist/                      ← old web export (git-ignored); shows a past "browse" tab
├── scripts/reset-project.js   ← template script — dangerous, don't run
├── app.json, package.json, tsconfig.json (alias "@/*" → project root), eslint, babel
└── .env                       ← Supabase URL + anon key (git-ignored ✔)
```

**Folders that do *not* exist:** `services/`, `utils/`, `types/`, `navigation/` (Expo Router replaces it), and `supabase/` (no migrations). Data access, business rules, and types all live inside screen files.

### The routing pattern (important to understand)
Expo Router turns files in `app/` into screens. COMET adds one level of indirection: **route files are 1-line re-exports** (`export { default } from "@/screens/Login"`) and the real code lives in `screens/`. The benefit is that screens can be moved or renamed without changing URLs. The cost is two places to look. `forgot-password.tsx` breaks this pattern by living directly in `app/`.

Folders in parentheses, such as `(auth)` and `(tabs)`, are **route groups**. They organize screens and share a layout without appearing in the URL.

### How the pieces connect
```
 app/_layout.tsx ──wraps everything in──▶ AuthProvider (context/AuthContext.tsx)
                                              │ getSession() + onAuthStateChange()
                                              ▼
                                     { session, user, loading }  ◀── useAuth()
                                              │
      ┌────────────────── route guards ───────┴──────────────────┐
 app/index.tsx           app/(auth)/_layout.tsx          app/(tabs)/_layout.tsx
 session? tabs:welcome   signed in + profile? → tabs     no session? → welcome
                                              │
                    screens/*  ──each screen calls directly──▶ lib/supabase.ts ──▶ Supabase
                       │                                         (auth, tables, storage,
                       └── renders components/ProfileCard, ui/Button, PolicyScreen      realtime)
```
There is no service layer. Every screen builds its own Supabase queries inline.

### Most important files
| File | Responsibility |
|---|---|
| [screens/Onboarding.tsx](../screens/Onboarding.tsx) | **3,335 lines.** All 15 onboarding steps, the custom pickers, photo handling, upload to Storage, and the profile insert. The single most important (and riskiest) file. |
| [components/ProfileCard.tsx](../components/ProfileCard.tsx) | How a person is presented. Defines the `ProfileData` type that Profile and Explore depend on. |
| [screens/Explore.tsx](../screens/Explore.tsx) | Current discovery plus the Signal action. |
| [screens/Chat.tsx](../screens/Chat.tsx) | Messaging, real-time subscription, and Orbit/Drift status changes. |
| [screens/Collision.tsx](../screens/Collision.tsx) | The Orbit list. |
| [context/AuthContext.tsx](../context/AuthContext.tsx) | Who is signed in. |
| [app/(auth)/_layout.tsx](../app/(auth)/_layout.tsx) | Decides when onboarding is "done" (a `profiles` row exists). |
| [lib/supabase.ts](../lib/supabase.ts) | Backend client and session storage. |
| [constants/theme.ts](../constants/theme.ts) | Design tokens. |

---

## 6. Data Model

### Where models are defined
There is **no central types file and no database schema in the repo**. Types are declared locally in the files that use them:
- `ProfileData`, `PromptEntry`: [components/ProfileCard.tsx:17-31](../components/ProfileCard.tsx#L17-L31). Used by Profile and Explore.
- `OnboardingData`, a second `PromptEntry`: [screens/Onboarding.tsx:528-545](../screens/Onboarding.tsx#L528-L545).
- `Match`: [screens/Collision.tsx:16](../screens/Collision.tsx#L16). `Message`, `MatchInfo`: [screens/Chat.tsx:19-31](../screens/Chat.tsx#L19-L31).
- `Profile`, `Prompt`: [screens/Browse.tsx:18-28](../screens/Browse.tsx#L18-L28) (legacy).

Supabase calls are untyped. Generated database types (`supabase gen types`) are not used, so a column-name typo compiles fine and only fails at runtime. That is exactly what happened with `signals` (below).

### Tables (Inferred from queries)
**`profiles`**: one row per user. `id` = the Supabase auth user id.
| Column | Type (inferred) | Written by | Read by |
|---|---|---|---|
| `id` | uuid | Onboarding | all |
| `name`, `gender`, `dating_intent`, `looking_for` | text | Onboarding | Profile, Explore, Collision/Chat (name) |
| `birthday` | date string `YYYY-MM-DD` | Onboarding | — |
| `age` | int (computed once on the client at signup, so it **never updates**) | Onboarding | Profile, Explore, Collision |
| `interests` | text[] / json (≤5) | Onboarding | ProfileCard |
| `prompts` | json `[{prompt, answer}]` (2–3) | Onboarding | ProfileCard |
| `photos` | text[] of public Storage URLs (1–5, first = main) | Onboarding | ProfileCard |
| `verified_photos` | text[] subset of `photos` | Onboarding | ProfileCard (badge) |
| `lifestyle` | json `{drink, smoke, workout}` | Onboarding | ProfileCard |
| `career` | json `{school, work}` | Onboarding | ProfileCard |
| `preferred_age_min/max` | int | Onboarding | **nobody** |
| `location_lat/lng` | float (precise GPS) or null | Onboarding | **nobody** |
| `last_active` | timestamp | **nobody in the app** | Browse (legacy) ordering |

Collected but **never saved:** `preferredDistance` (onboarding step 5). *(Verified: it isn't in the `upsert` at [Onboarding.tsx:951](../screens/Onboarding.tsx#L951).)*

**`signals`**: expressions of interest. ⚠️ **Two incompatible shapes in the code:**
- Explore (live): `{ from_user_id, to_user_id }`, and the result is not checked ([Explore.tsx:43](../screens/Explore.tsx#L43)).
- Browse (legacy, the one that made matches): `{ swiper_id, swiped_id, type: "like" }` ([Browse.tsx:98](../screens/Browse.tsx#L98)).

Only one of these matches the real table. Browse has debugging alerts for RLS errors and was the screen used when collision logic was built (commit `9916237`), so `swiper_id/swiped_id` is more likely the real schema. If so, Explore's Signal **fails silently**. *(Inferred. Check the Supabase dashboard.)*

**`matches`**: Collisions/Orbits.
`id, user1_id, user2_id, status, orbit_level, orbit_started_at, created_at`.
- `status` values in code: `collided` → `orbit` → (`committed`) / `drifted`.
- `committed` and `orbit_level` appear in labels, but **no code ever sets them**. This is a planned progression system.

**`messages`**: `id, match_id, sender_id, content, created_at`.

**`orbit_events`**: audit log: `match_id, event_type ("entered" | "drifted"), triggered_by`.

**Storage bucket `profile-photos`**: path `<userId>/<timestamp>-<index>.<ext>`, public URLs.

### How data moves
```
Onboarding local state (OnboardingData)
   └─ "Let's go" → upload photos to Storage → upsert profiles row → /(tabs)
Profile tab:   select own profiles row ─▶ ProfileCard
Explore tab:   select ALL other profiles (no filter, no limit) ─▶ ProfileCard
               Signal ─▶ insert signals (no mutual check, no match creation)
Orbit tab:     select matches for me (status ≠ drifted) ─▶ 1 extra profiles query per match
Chat:          select match + other user's name; if "collided" → update to "orbit" + log event
               select messages; subscribe to new inserts; insert on send
               Drift ─▶ update match "drifted" + log event
```
All data is fetched fresh, held in that screen's `useState`, and discarded when the screen unmounts. Nothing is cached or shared across screens. The only cross-screen state is the auth session.

---

## 7. Component Architecture

### `ProfileCard`: [components/ProfileCard.tsx](../components/ProfileCard.tsx) (423 lines)
- **Renders:** a horizontal paging photo swiper with dots and Verified badges (or an initial-letter placeholder), then a panel with an eyebrow, name and age, gender and intent pills, "Mission Log" prompts, interest pills, and Lifestyle phrases with icons.
- **Used in:** Profile and Explore.
- **Receives:** `profile: ProfileData`. It's display-only: no callbacks, no actions.
- **Owns state:** `photoIndex` (inside the internal `PhotoSwiper`).
- **Assessment:** the responsibility is right: one prop in, pure presentation, no data fetching. Good reuse. Issues: (1) it owns the core domain type `ProfileData` and the label maps, which belong in a shared `types/` or `constants/` module; (2) the onboarding preview duplicates it instead of using it; (3) it measures the screen width once at module load, which is fragile on tablets and rotation (`supportsTablet: true`); (4) it uses RN `Image` (no caching) for remote photos.

### `Button`: [components/ui/Button.tsx](../components/ui/Button.tsx)
- **Renders:** a pill button. `primary` = blue→teal gradient + teal glow; `secondary` = glass; `cta` = orange outline + orange glow. Shows a spinner while loading.
- **Used in:** Welcome, Login, SignUp, ForgotPassword, Onboarding.
- **Receives:** `label, onPress, variant, style, loading, disabled`.
- **Owns:** an animated press scale.
- **Assessment:** clean and appropriate, and the best example of the design system in use. Not yet adopted by Explore (which hand-rolls the same gradient for Signal), Profile (sign out), Collision, or Chat. Has no accessibility props.

### `PolicyScreen`: [components/PolicyScreen.tsx](../components/PolicyScreen.tsx)
- **Renders:** a back header, title, "Last Updated", and a scroll list of section cards (orange headings).
- **Used in:** terms, privacy, guidelines, safety.
- **Receives:** `title, updated, sections[]`. Stateless. Good design.

### `Onboarding`: [screens/Onboarding.tsx](../screens/Onboarding.tsx): ⚠️ too large
- One component with **~30 pieces of state and refs**, and 15 steps rendered through a `switch`. It also contains 3 "edit section" sub-modes, a profile preview, two modals (photo source sheet, choose main photo), location permission handling with an `AppState` listener, the photo upload pipeline, age calculation (written 3 times), and the database write.
- **Embedded sub-components worth extracting:** `PickerColumn` / `BirthdayPicker`, `InterestChip`, and `LifestyleOption`. They are well built and would be reusable for a future Edit Profile screen.
- **Hard to maintain because:**
  - The `case` blocks are out of order in the source (11, 10, 9, 8, 12…) after a step reorder.
  - Step numbers are magic values checked in several places (`step === 10`, `12`, `13`).
  - The prompt-answer editor is duplicated almost line-for-line (~line 1203 and ~line 1934).
  - The lifestyle label maps are duplicated from ProfileCard.
- **Recommendation:** don't rewrite it. When you next need to touch it, extract the step metadata into an ordered array and move each step into its own file. Pull out the pickers when you build Edit Profile.

### Screen components (data + UI mixed)
| Screen | Lines | Owns | Note |
|---|---|---|---|
| Welcome | 239 | video/audio players, animations | Polished. |
| Login / SignUp | 240 / 281 | form fields, focus, loading | ~80% duplicated styles between the two (and ForgotPassword). Layout uses a `marginTop: -300` hack. |
| Profile | 109 | profile, loading | Fine. Only place to sign out. |
| Explore | 187 | profiles, index, actioning | Signal logic bug (§6). |
| Collision | 227 | matches, loading | N+1 queries; old styling. |
| Chat | 410 | messages, matchInfo, text, sending | Business rules (status transitions) inside UI; subscription leak (§10). |
| Browse | 409 | — | **Dead code.** Contains the only working mutual-match logic. Keep it as a reference until Explore is fixed, then delete. |
| Settings | 9 | — | Placeholder. |

---

## 8. User Flows

**Account creation**
User taps "CREATE AN ACCOUNT" → `SignUp` → validate (filled, passwords match, ≥6 chars) → `supabase.auth.signUp` → `router.replace("/(auth)/onboarding")`.
⚠️ If Supabase **email confirmation** is on, `signUp` returns no session, `user` stays null, and the final "Let's go" in onboarding silently does nothing (`if (!user) return;`). *(Verified code path. The project setting is Unknown.)*

**Login**
Email + password → `signInWithPassword` → on success **no explicit navigation**. The `(auth)` layout notices the new session, checks for a `profiles` row, and redirects to tabs. If there's no profile, the user stays on the Login screen with no feedback. *(Verified.)*

**Forgot password**
Email → `resetPasswordForEmail` → "Check your email" state. **Incomplete:** the app has no screen to set a new password from the email link (`detectSessionInUrl: false`, and there's no deep-link handler). Reset only works if Supabase's default web page handles it. *(Inferred.)*

**Onboarding / profile creation** (15 steps; progress bar; Continue disabled until valid)
| # | Step | Rule |
|---|---|---|
| 0 | Name | letters, spaces, `'`, `-`; max 30 |
| 1 | Birthday (drum picker) | years limited to 18+ by year only (see §10) |
| 2 | Gender | Male / Female / Non-binary / Prefer not to say |
| 3 | Who to see | Men / Women / Everyone |
| 4 | Age range | slider 18–80 |
| 5 | Distance | slider 1–100+ mi (**not saved**) |
| 6 | Lifestyle | drink / smoke / workout |
| 7 | School & work | |
| 8 | Interests | 1–5 from 7 categories |
| 9 | Prompts | 2–3 from 28, with 6 random suggestions + "see more" |
| 10 | Photos | 1–5; library or "live" (see §0); choose main photo |
| 11 | Dating intent | 4 options |
| 12 | Location | permission required; deep-links to Settings if denied |
| 13 | Preview | editable prompts, interests, lifestyle |
| 14 | "How COMET works" | → **Let's go**: upload photos → upsert profile → tabs |

**Incomplete:** progress is never saved. Quitting mid-flow loses everything. Worse, a user who has signed up but has no profile, on next launch, is sent by `app/index.tsx` straight to tabs (it only checks session). Profile then shows "Could not load profile", and there is **no path back to onboarding**. *(Verified.)*

**Profile viewing:** Profile tab → fetch own row → `ProfileCard` + Sign Out. **Profile editing after onboarding: not implemented.**

**Discovery:** Explore tab → fetch all other profiles once on mount → show `profiles[index]`. **Pass** → index+1 (not saved). **Signal** → insert signal (error ignored) → index+1. At the end: "You've seen everyone". Nothing is filtered by gender preference, age, distance, prior signals, existing matches, or exclusivity.

**Matching:** **Broken in the live UI** (§6). The intended logic, which lives only in Browse.tsx, is: after inserting a signal, look for the reverse signal; if found, insert a `matches` row with `status: "collided"` and show an alert. It's done on the client, so two users signaling at the same moment could create duplicate matches. *(Inferred. Depends on DB constraints.)*

**Messaging:** Orbit tab → list (re-fetched on focus) → tap → `/chat/[matchId]` → the first open by either user moves `collided` → `orbit` and logs an event → messages load plus real-time subscription → send inserts a row (your own message appears via the real-time echo, with no optimistic display). **Drift** → confirm → status `drifted` + event → back. Drifted matches disappear from the list.
Missing: read receipts, typing indicator, unread badges, push notifications, photos in chat, timestamps, and showing the match's photo (the list uses an initial-letter avatar).

**Settings:** **Not implemented** (placeholder file, not routed). There is no account deletion, which **app stores require for apps with account creation.**

**Legal/safety pages:** reachable from Login and SignUp (Terms, Privacy). Guidelines and Safety routes exist, but **no screen links to them** *(Verified by search)*.

---

## 9. Current Feature Inventory

| Area | Feature | Status |
|---|---|---|
| **Entry** | Animated Welcome with video, music toggle | ✅ Complete |
| **Auth** | Email sign up / log in / sign out | ✅ Works (edge cases in §8) |
| | Forgot password (request email) | 🟡 Half: no in-app reset screen |
| | Session persistence in secure storage | ✅ |
| | Route guards | 🟡 Gap for signed-in users without a profile |
| **Onboarding** | 15-step flow, validation, animations, haptics | ✅ Polished |
| | Photo upload to Storage, main-photo selection | ✅ |
| | Photo verification | 🔴 Placeholder logic (library photo counts as "live") |
| | Profile preview + inline edit | ✅ |
| | Save progress / resume | ❌ |
| **Profile** | View own profile | ✅ |
| | Edit profile / photos | ❌ |
| **Discovery** | One-at-a-time full profile view, Pass/Signal | 🟡 UI done; logic incomplete |
| | Filtering by preferences / distance | ❌ |
| | Exclusivity ("discovery pauses") | ❌ |
| **Matching** | Mutual-signal Collision | 🔴 Only in dead Browse.tsx |
| | Orbit levels / "Committed" | ❌ Placeholders in labels only |
| | 7-day countdown (roadmap) | ❌ |
| **Messaging** | Real-time 1:1 chat | ✅ Basic |
| | Drift | ✅ |
| | Push notifications, read receipts | ❌ |
| **Safety & trust** | Guidelines/Safety/Terms/Privacy text | ✅ Content exists (not legal-reviewed; *Assumption*) |
| | Report / block / moderation | ❌ |
| **Settings** | Anything | ❌ |
| **Design system** | Tokens, Button, PolicyScreen, ProfileCard | 🟡 Started; adoption partial |

---

## 10. Development History (What the Code and Git Show)

1. **Mar 11, 2026: scaffold.** Created with `create-expo-app` (default template). That explains the unused `themed-*`, `hello-wave`, `parallax-scroll-view`, `modal.tsx`, React logos, `reset-project.js`, template `Colors`/`Fonts`, and the boilerplate README. Skeleton screens were created for every area at once (`65a16c3`), including `Settings.tsx`, which was never developed further. The leftover `App.js` comes from the even older "blank" template described in the roadmap.
2. **Mar 12: the Welcome experience.** Logo, background, animations, gradients, border animations, music with a silent-mode toggle. The visual identity started here.
3. **Mar 12–16: auth and core loop.** Supabase auth, onboarding questions, photo uploads, then **Browse + Collision + Chat** (`09353fb`, `9916237`). This "first generation" UI is the plain black and system-font style still visible in Collision and Chat.
4. **Mar 17: legal.** Policies, `PolicyScreen`, forgot password.
5. **Mar 30: the profile pivot.** Explore was created (`03ab663`) and replaced Browse as the discovery tab. The old `dist/` web export still shows a `browse` tab, which confirms this. `ProfileCard` was extracted (`37333ab`). **Explore was written with new signal column names and without the mutual-match logic.** This is where the matching regression began. Onboarding grew: age range, distance, lifestyle, career, name validation.
6. **Apr 3–8: design-language pass.** The onboarding palette changed, the shared `Button` was created (`9cd94fd`), and the "selected" state was refined (including "remove glow on pill"). Profile preview with edit was added, and the profile cards were unified (`41dafc0`). The onboarding preview was not converted to `ProfileCard`.
7. **Jun 8: verification + storage.** Photos are now uploaded to Supabase Storage (they were local URIs before). "Verified photos" and the SQL photo policies were added. The SQL itself was written in the Supabase dashboard and **never committed**.

**Why it looks the way it does:** the visual design was upgraded screen by screen, starting from the user's first impression (Welcome → Auth → Onboarding → Profile card). The pass stopped before reaching Orbit, Chat, and the tab bar. Meanwhile, rebuilding discovery (Browse → Explore) dropped the matching logic. Commit messages are short and UI-focused ("change UI", "fix select buttons"), which suggests fast visual iteration. *(Inferred.)*

**Leftovers and temporary solutions found:**
- `// REPLACE: requestCameraPermissionsAsync` and `//REPLACE: witt --> .launchImageCameraAsync` ([Onboarding.tsx:711-718](../screens/Onboarding.tsx#L711-L718)). The camera was apparently swapped for the library temporarily, likely because the iOS Simulator has no camera. *(Inferred.)*
- Browse.tsx alerts like "Insert succeeded but no row was returned. Possible RLS issue.": debugging scaffolding.
- `formWrapper: { marginTop: -300 }` in auth screens: a layout workaround.
- `.expo/xcodebuild-error.log` and `.claude/settings.local.json` (a local AI-tool permission file) are committed. There are no TODO/FIXME comments anywhere.

---

## 11. Technical Debt

### Must address soon (correctness, trust, privacy)
1. **Restore matching in Explore.** Use the real `signals` columns, check the insert error, and create the Collision. Best practice: do the mutual check and match creation **in the database** (a Postgres function or trigger called via `supabase.rpc`), so it's atomic and can't be duplicated or spoofed by a modified client.
2. **Fix photo verification.** Either wire the real camera (`requestCameraPermissionsAsync` + `launchCameraAsync`) or hide the Verified badge until real verification exists. Today the trust signal is false. Longer term, verification should be decided server-side (for example, a selfie check). Anything the client decides can be forged.
3. **Put the database under version control.** Use the Supabase CLI (`supabase db pull`) to commit the schema, RLS policies, and storage policies. Then confirm that RLS is on for every table and **verify what other users can read**, especially `birthday` and precise `location_lat/lng`. *(Risk is Inferred. Policies are Unknown.)*
4. **Store less precise location.** Round or approximate coordinates (or store a geohash/city) before saving. Precise GPS of dating-app users is high-risk data.
5. **Fix the "signed in, no profile" dead end.** Have `app/index.tsx` and `(tabs)/_layout.tsx` check for a profile and route to onboarding. Also handle the email-confirmation case after sign-up.
6. **Chat real-time cleanup.** `subscribeToMessages()` returns a cleanup function, but the `useEffect` discards it ([Chat.tsx:46-51](../screens/Chat.tsx#L46-L51)). Channels are never removed, so reopening a chat can stack subscriptions (duplicate messages, leaked connections). *(Verified leak. Duplicate symptom is Inferred.)*
7. **Silent failures.** Explore's signal insert, Profile/Explore/Collision fetches, the auth-layout profile check, and Chat status updates all ignore `error`. Add at least a user-visible message on failure.
8. **Account deletion + report/block.** Both are required for App Store / Play Store approval of a dating app. Your own Guidelines promise reporting.

### Should improve
- **Generate Supabase TypeScript types** (`supabase gen types typescript`) and create the client with them. That would have caught the `signals` column mismatch at compile time.
- **Move domain types and data access out of screens:** a `types/` folder (Profile, Match, Message), and small query functions (`lib/profiles.ts`, `lib/matches.ts`). This doesn't require a large refactor. Do it as you touch each feature.
- **Apply preferences in discovery:** gender preference, age range, saved distance, excluding already-signaled or passed users, and the exclusivity lock. Paginate (`.limit()`); Explore currently loads every profile.
- **Save `preferredDistance`** and keep `last_active` updated (or drop it).
- **Age:** compute from `birthday` when displaying (the stored `age` goes stale). Enforce 18+ with the full date, not the year (a person born in December of the cutoff year can currently be 17). Ideally also enforce it with a database check.
- **Collision N+1:** fetch matches and profiles in one query using a foreign-key join, or a database view.
- **Bring Collision, Chat, and the tab bar into the design language.** Set the app to `userInterfaceStyle: "dark"` and use `DarkTheme`, fix the hardcoded black tab icons, and use Montserrat and tokens.
- **Accessibility:** there are **zero** `accessibilityLabel`/`accessibilityRole` props in the codebase. Icon-only buttons (music toggle, `←`, `✕`, send `↑`) are unlabeled for screen readers. 10-px `#555` legal text on near-black is low contrast.
- **Android permissions:** `RECORD_AUDIO` and others are listed twice, and audio recording isn't used. Remove anything unused before store review.
- **Orphaned photos:** if a profile save fails after upload, the files stay in Storage. Re-running onboarding uploads new copies.

### Nice to clean up later
- Delete the Expo template leftovers (§5), `App.js`, `Browse.tsx` (after porting its logic), the unused logos and images, `scripts/reset-project.js`, and unused `@shopify/react-native-skia` and `expo-image` (or adopt `expo-image` for cached photos).
- Extract shared auth-form styles and an `<AuthInput>` component (Login, SignUp, and ForgotPassword are ~80% identical).
- Replace text glyph icons with one icon family, and make back buttons consistent.
- Centralize label maps (`DRINK_LABEL`, …) and the age calculation (currently 3 copies).
- Use `ProfileCard` in the onboarding preview (add an optional `onEditSection` prop).
- Stop committing `.expo/` logs and `.claude/settings.local.json`. Add a `.env.example`. Replace the README.
- Consider a smaller Welcome video. It's a 4K, 6.3 MB file shown on a phone screen.
- Fix the 2 lint errors and 1 warning.

---

## 12. Unfinished Work: Evidence

| Evidence | Location | Meaning |
|---|---|---|
| `REPLACE:` comments; live photo uses library picker | Onboarding.tsx:711-718 | Camera capture planned, not done |
| `committed` status, `orbit_level`, "Level N" UI | Collision.tsx, Chat.tsx | Orbit progression designed, never set |
| "discovery pauses" copy | Onboarding step 14 | Exclusivity planned, not enforced |
| `Settings.tsx` placeholder | screens/ | Settings planned |
| `preferred_age_*`, `location_*`, `looking_for` saved but unread | Onboarding upsert | Preference matching planned |
| Distance slider not persisted | Onboarding step 5 | Incomplete |
| "Users can report profiles…" | guidelines.tsx | Reporting promised, not built |
| Guidelines & Safety routes unlinked | app/(auth)/ | Built, not wired in |
| Initial-letter avatars | Collision.tsx:129 ("Avatar placeholder") | Photos not used in match list |
| Roadmap PDF: queue lock, 7-day timer, push, read receipts, age gate, moderation, EAS deploy | `../COMET Images/` | Planned, none implemented |
| Unused Skia dependency | package.json | Possibly planned visual effects (Inferred) |

---

## 13. Recommended Next Steps

A realistic order, smallest useful deliverables first. Each is a checkpoint you can verify on a device with two test accounts.

1. **Make the database visible (≈1 session).** Run `supabase db pull`, commit the schema, and generate types. *Checkpoint:* you can answer "what columns does `signals` have and what can another user read from `profiles`?" by reading the repo.
2. **Repair the core loop (≈1–2 sessions).** Fix the Explore Signal so it creates Collisions (ideally with a DB function), and fix the no-profile routing and chat subscription cleanup. *Checkpoint:* accounts A and B signal each other → both see the Orbit → they chat in real time → Drift works.
3. **Make the trust signal honest (small).** Real camera capture, or hide the badge.
4. **Decide the exclusivity rules (a product decision, yours to make).** Can someone in an Orbit still browse? Can they receive Signals? Is there a time limit? Then implement them on the server.
5. **Store-readiness basics.** Settings with sign-out, account deletion, and report/block. Approximate location. Full-date 18+ check.
6. **Design consistency pass.** Orbit list, Chat, and tab bar in the COMET visual language.

Longer-term phases: Edit Profile (reusing the onboarding pickers), preference-based discovery with pagination, push notifications, Orbit progression, and EAS build and TestFlight.

---

## 14. Notes for an AI Copilot

- **Run:** `npm install`, then `npx expo start` (or `npm run ios` for a dev build; native `ios/` and `android/` folders exist). `.env` needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. There is also an `API_KEY` variable that no code references (Unknown purpose).
- **Checks:** `npx tsc --noEmit` (currently clean) and `npx expo lint`. There are no tests.
- **Conventions:** screens go in `screens/` and are re-exported from `app/`; the import alias `@/` is the project root; use `StyleSheet.create`; Montserrat font names are `"Montserrat-Regular"` / `"Montserrat-Bold"`; prefer tokens from `constants/theme.ts` and the shared `Button`.
- **Never run** `npm run reset-project`. It moves the `app/` directory.
- **Don't assume database columns.** Verify them against the Supabase schema (once it's committed) before writing queries. The `signals` mismatch is a live example.
- **Product guardrails:** features should favor depth over volume. Avoid swipe gestures, infinite feeds, streak or engagement mechanics, and anything that treats people as disposable. Keep the space vocabulary (Signal, Collision, Orbit, Drift) tasteful and consistent.
