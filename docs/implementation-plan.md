# Batch Meal Prep Planner — Implementation Plan

## Review Summary

**Reviewed:** 2026-06-05 | **Reviewers:** VP Product, VP Engineering, VP Design

### Changes Applied

| # | Change |
|---|--------|
| 1 | Defined `passiveWindow` explicitly in session estimate formula |
| 2 | Swapped Wave order: fallback sequencer (new Wave 7) built before AI game plan (new Wave 8) |
| 3 | Added `lib/session.ts` implementation tasks to Wave 3 |
| 4 | Corrected model ID from `claude-haiku-4-5-20251001` to `claude-haiku-4-5` everywhere |
| 5 | Moved `<Toast>` component build to Wave 1 so it's available before Wave 8 needs it |
| 6 | Added rate limiting / debounce requirement on `/api/sequence` Regenerate button |
| 7 | Added content strategy section to Wave 5 for ~25 new library items |
| 8 | Added unit normalization requirement to ingredient aggregation in Wave 4 |
| 9 | Replaced destructive "remove API key" prod test with staging mock approach |
| 10 | Added `.env.local` / `.env.example` setup step to Wave 1 |
| 11 | Added image source strategy (local `/public/items/` assets + placeholder) to Wave 2 |
| 12 | Added shared `lib/types.ts` file to Wave 1 Critical Files and Wave 2 tasks |
| 13 | Added empty / first-time-user state spec to Wave 3 |
| 14 | Clarified shopping list checkbox reset behavior as a deliberate design decision |
| 15 | Changed `validate-library.js` to `validate-library.ts` (run via `ts-node`) |
| 16 | Added defined selected / hover / focus states for `CategoryFilter` chips to Wave 3 |
| 17 | Flagged Wave 6 (Repeat Last Prep) as optional scope; can be deferred post-launch |
| 18 | Changed disabled nav links to use `aria-disabled="true"` + tooltip (not HTML `disabled`) |
| 19 | Added WCAG 3:1 focus ring contrast check for terracotta on paper to Wave 9 |
| 20 | Added `alt` text and `aria-label` strategy for `PrepItemCard` images to Wave 3 |
| 21 | Added two additional session estimate verification scenarios to Verification Checkpoints |

---

## Context

Greenfield Next.js 15 web app. No source code exists yet. The PRD defines a single-user tool where a user selects batch-prep items from a curated ~30-item library, receives an aggregated shopping list, and gets an AI-sequenced game plan (what to start first, what runs in parallel, storage targets). The design system spec defines a warm cookbook aesthetic with terracotta + sage accents, Lora serif headings, Inter UI text, and strict 44px min tap targets.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styles | Tailwind CSS v4 + CSS custom properties |
| AI | Claude API (`claude-haiku-4-5`) — server-side only |
| Hosting | Vercel |
| Persistence | Browser `localStorage` only |
| Data | Static `/data/library.json` |

---

## Wave 1 — Scaffold & Design Tokens

**Goal:** Working Next.js app deployed to Vercel with design system and shared infrastructure wired up.

1. `npx create-next-app@latest` — App Router, Tailwind, TypeScript, `src/` dir
2. Add Google Fonts: `Lora` (serif) + `Inter` (sans) via `next/font`
3. Define CSS custom properties in `globals.css`:
   - Colors: `--color-paper #F9F5EE`, `--color-spice #C24E1A`, `--color-herb #4A6741`, and all tokens from the design spec
   - Spacing: `--space-1` through `--space-20` (4px base unit)
   - Radius: `--radius-sm 3px`, `--radius-card 14px`, `--radius-pill 999px`
4. Configure `tailwind.config.ts` to extend theme with CSS vars
5. Create `lib/types.ts` — shared TypeScript interfaces for all domain types (Item, Ingredient, Step, Session)
6. Build shared `<Header>` component — 3 nav links (Item Picker / Shopping List / Game Plan); use `aria-disabled="true"` + tooltip when no items selected (not HTML `disabled` on `<a>` elements)
7. Build `<Toast>` component — dark bg, cream text, spice action link, 3–4s auto-dismiss, respects `prefers-reduced-motion`
8. Create `.env.example` with `ANTHROPIC_API_KEY=` and `CLAUDE_MODEL=claude-haiku-4-5`; copy to `.env.local` for local dev
9. Add placeholder home page (`/`)
10. Deploy to Vercel — confirm build passes with `ANTHROPIC_API_KEY` env var stubbed

---

## Wave 2 — Item Library (5 Items)

**Goal:** Valid `/data/library.json` with 5 diverse items covering all schema fields.

### Item Schema (defined in `lib/types.ts`)

```ts
interface Ingredient {
  name: string        // always lowercase, normalized (e.g. "olive oil" not "Olive Oil")
  quantity: number
  unit: string        // canonical unit: "g" | "ml" | "tbsp" | "tsp" | "cup" | "whole" | etc.
  isPantryStaple: boolean
}

interface Item {
  id: string          // unique slug
  name: string
  category: "breakfast" | "snack" | "protein" | "sauce" | "sides" | "treat"
  handsonMinutes: number
  totalMinutes: number   // must be ≥ handsonMinutes
  equipment: string[]    // [] if none
  ovenTemp: number | null  // required if equipment includes "oven", otherwise null
  storage: ("fridge" | "freezer" | "pantry")[]
  isPantryHeavy: boolean
  imageAlt: string       // descriptive alt text for the card image
  ingredients: Ingredient[]
}
```

### Image Strategy

- Store item images as `/public/items/{id}.jpg` (3:2 ratio, ≥600px wide)
- Use a generic placeholder (`/public/items/placeholder.jpg`) for any item without an image
- Each item's `imageAlt` field provides the `alt` text for `<img>` elements

### Starter Items (one per equipment type)

| Item | Equipment |
|------|-----------|
| Protein Waffles | waffle-iron + blender |
| Energy Balls | none |
| Roasted Chickpeas | oven |
| Flank Steak Marinade | stovetop |
| Overnight Oats | none |

Ingredient names: always lowercase. Units must be consistent across all items — e.g. always `"tbsp"` not sometimes `"tablespoon"`. This is enforced by the Wave 5 validation script.

---

## Wave 3 — Item Picker Screen (`/`)

**Goal:** Fully functional Screen 1 per PRD §5, including `lib/session.ts`.

### Build `lib/session.ts` first

Implement and export:
- `calculateSessionEstimate(items: Item[]): number` — formula below
- `saveSession(selectedIds: string[], timeWindow: number): void` — writes to `localStorage`
- `loadSession(): { selectedIds: string[]; timeWindow: number } | null` — reads from `localStorage`
- `saveLastPrep(selectedIds: string[], timeWindow: number): void`
- `loadLastPrep(): { selectedIds: string[]; timeWindow: number } | null`

**Session estimate formula:**
```
passiveWindow = totalMinutes[longestItem] - handsonMinutes[longestItem]
estimate = max(totalMinutes) + max(0, Σ(handsonMinutes of all other items) − passiveWindow)
```
`passiveWindow` is the gap between total and hands-on time for the single longest item — the window during which other items can run in parallel.

### State
- `selectedIds: string[]` — synced to `localStorage` via `lib/session.ts`
- `timeWindow: number` — 30–300 min in 30-min increments

### Components

| Component | Description |
|-----------|-------------|
| `TimeWindowPicker` | Dropdown or stepper, 30–300 min |
| `CategoryFilter` | Filter chips per category; selected chip: spice bg + cream text; hover: light spice bg; focus: spice ring |
| `PrepItemCard` | 3:2 image (`alt` from `item.imageAlt`), category label, Lora serif name, time metadata; selected state = spice border + ring + checkmark badge |
| `TimeBudgetBar` | Fills spice ≤75%, amber 76–100%, red >100% of window; 0.3s ease |
| `SessionEstimateDisplay` | Displays estimate using formula from `lib/session.ts`; shows red warning when over budget |
| `EmptyState` | Shown on first load or when category filter returns no results: warm illustration, prompt to "Pick something to prep this week" |

### Rules
- "View Shopping List" CTA: `aria-disabled="true"` + tooltip if 0 items selected
- Sessions with 0 items redirect to `/`
- `PrepItemCard` images use `item.imageAlt` for `alt`; fallback to placeholder image if file missing

---

## Wave 4 — Shopping List Screen (`/shopping-list`)

**Goal:** Fully functional Screen 2 per PRD §6.

### Aggregation Logic
1. Normalize units before aggregating — convert all quantities to a canonical unit per ingredient (e.g. all oil in `tbsp`) so `"2 tbsp olive oil"` + `"1 tbsp olive oil"` = `"3 tbsp olive oil"` rather than creating duplicate rows
2. Group ingredients across selected items by `(name, canonicalUnit)`, sum quantities
3. Split into two sections:
   - **Buy** — `isPantryStaple: false`
   - **Check Your Pantry** — `isPantryStaple: true`
4. Herb-colored round checkboxes per row — client state only, intentionally not persisted (navigating away resets checks; this is by design so the list feels fresh each session)

### Components

| Component | Description |
|-----------|-------------|
| `IngredientSection` | Buy / Pantry variants with section header |
| `IngredientRow` | Name, quantity + unit, herb checkbox |

CTA: "Generate Game Plan" → `/game-plan`

---

## Wave 5 — Library Expansion (~30 Items) + Validation

**Goal:** Full curated library covering all 6 categories; data quality enforced by script.

### Content Strategy

Before writing items, draft a spreadsheet (or doc) with:
- 5–6 items per category (`breakfast`, `snack`, `protein`, `sauce`, `sides`, `treat`)
- Diversity of equipment types across the full set
- A range of `totalMinutes` (15 min quick items through 90+ min slow-cooker items)
- At least 3 items with `ovenTemp` set (to exercise the ±25°F constraint)
- Normalized ingredient names agreed upfront (e.g. `"rolled oat"` not `"oats"`)

Finalize the item list before writing JSON to avoid inconsistent naming that the validator must then catch.

### Validation Script

Write `scripts/validate-library.ts` (run via `npx ts-node scripts/validate-library.ts`):
- All required fields present with correct types
- `handsonMinutes ≤ totalMinutes`
- `ovenTemp` present iff `equipment` includes `"oven"`
- Ingredient names lowercase and consistent across all items
- Unit strings match the canonical unit list
- At least one storage option per item
- `imageAlt` non-empty string on every item

Add `"validate": "ts-node scripts/validate-library.ts"` to `package.json`.

Run `npm run validate`; fix all issues before Wave 6.

---

## Wave 6 — Repeat Last Prep *(optional — defer post-launch if timeline slips)*

**Goal:** One-tap shortcut to restore the previous session.

- On navigating to `/game-plan`, `lib/session.ts`'s `saveLastPrep()` persists `{ selectedIds, timeWindow }` to `localStorage`
- On Item Picker load: if a last prep exists, show **"Repeat last prep"** button above item grid
- Clicking restores previous selection and time window via `loadLastPrep()`

> **Scope note:** This feature is self-contained and low-risk, but it is a nice-to-have. If Wave 7 or Wave 8 runs long, skip this wave and ship post-launch.

---

## Wave 7 — Fallback Sequencer (Client-Side)

**Goal:** Rule-based sequencer that mirrors AI output when API is unavailable. Built *before* the AI game plan screen so it can be imported in Wave 8.

**Location:** `lib/sequencer.ts` — pure function, no API calls, fully unit-testable.

### Algorithm
1. Sort items by `totalMinutes` descending
2. Greedily assign items to time slots respecting equipment constraints
3. Flag equipment conflicts → schedule conflicting items sequentially
4. Return steps in the same `Step[]` schema as the API route

### Unit Tests
Write `lib/sequencer.test.ts` covering:
- Basic ordering (longest total time first)
- Oven conflict (two items at different temps >25°F → sequential)
- Stovetop max-2 constraint
- Single-use equipment conflicts (waffle-iron, mixer, blender)
- Worked example from PRD §13 (Protein Waffles + Energy Balls + Flank Steak at 50 min)

---

## Wave 8 — AI Game Plan Screen (`/game-plan`)

**Goal:** Fully functional Screen 3 per PRD §7 with Claude API integration.

### Server Route — `app/api/sequence/route.ts`
- Receives `POST { selectedIds, timeWindow }`
- Reads items from library JSON server-side (`ANTHROPIC_API_KEY` never touches client)
- Builds prompt encoding equipment constraints, `handsonMinutes`, `totalMinutes`, storage preferences
- Calls `claude-haiku-4-5` (fallback: `claude-sonnet-4-6` if JSON parsing issues arise)
- Returns structured JSON:
  ```ts
  { steps: Step[] }  // Step defined in lib/types.ts
  ```
- **Rate limiting:** Enforce a minimum 5-second cooldown between calls server-side (store last-call timestamp in a module-level variable or edge KV) so the Regenerate button cannot spam the API

### Client Page — `app/game-plan/page.tsx`
- Loading state (spinner or skeleton cards) while awaiting API
- `PrepStepCard` list: numbered, action text, italic note, storage badge
- Total hands-on minutes shown below steps
- **Regenerate** button — disabled for 5 seconds after each call (mirrors server-side rate limit); new API call only on explicit click
- On API error: import and run `lib/sequencer.ts` fallback, show `<Toast>` "Using offline sequencer"

### Equipment Constraints to Encode in Prompt

| Equipment | Constraint |
|-----------|-----------|
| Oven | One at a time unless temps within 25°F |
| Stovetop | Max 2 burners simultaneously |
| Waffle-iron, mixer, blender, food processor, slow cooker | One at a time each |

---

## Wave 9 — Responsive Polish + Accessibility

**Goal:** Ship-ready across mobile and desktop.

- Verify 44×44px tap targets on all interactive elements
- Test header nav on mobile (stack layout)
- `PrepItemCard` grid: 1-col mobile → 2-col tablet → 3-col desktop
- Add `prefers-reduced-motion` guard on budget bar and card transitions (already in `<Toast>`)
- Focus rings: always visible — verify terracotta (`#C24E1A`) on paper (`#F9F5EE`) meets WCAG 3:1 minimum ratio for focus indicators; adjust lightness if it falls short
- Color contrast audit: all text ≥ 7:1 against background
- Confirm `aria-disabled` + tooltips on disabled nav links and CTAs work with keyboard and screen readers
- Confirm all `<img>` elements have meaningful `alt` text from `item.imageAlt`

---

## Wave 10 — Deploy

**Goal:** Live production Vercel deployment.

1. Set `ANTHROPIC_API_KEY` in Vercel environment variables (Production + Preview)
2. Set `CLAUDE_MODEL=claude-haiku-4-5`
3. Push to `main` → Vercel auto-deploys
4. Smoke-test golden path: pick items → shopping list → game plan
5. Test fallback sequencer: set `ANTHROPIC_API_KEY` to an invalid value in a **Preview** deployment (not production) — confirm toast appears and offline sequencer output renders correctly; restore valid key afterward

---

## Critical Files

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Item Picker screen |
| `app/shopping-list/page.tsx` | Shopping List screen |
| `app/game-plan/page.tsx` | Game Plan screen |
| `app/api/sequence/route.ts` | Server-side Claude API call with rate limiting |
| `data/library.json` | Static item library (~30 items) |
| `lib/types.ts` | Shared TypeScript interfaces (Item, Ingredient, Step, Session) |
| `lib/sequencer.ts` | Rule-based fallback sequencer (pure function) |
| `lib/session.ts` | Session estimate formula + localStorage helpers |
| `components/Header.tsx` | Shared nav with `aria-disabled` logic |
| `components/PrepItemCard.tsx` | Selectable item card |
| `components/TimeBudgetBar.tsx` | Visual time gauge |
| `components/Toast.tsx` | Auto-dismiss notification |
| `scripts/validate-library.ts` | Library data quality check (ts-node) |
| `app/globals.css` | Design token CSS custom properties |
| `.env.example` | Environment variable template |

---

## Verification Checkpoints

| Wave | Test |
|------|------|
| 3a | Pick Protein Waffles (25 hands-on / 25 total) + Energy Balls (20/20) + Flank Steak (15/15) at 50 min → `passiveWindow = 0`, estimate = 25 + 20 + 15 = 60 min shown in red |
| 3b | Pick only Overnight Oats (5 hands-on / 480 total) + Energy Balls (20/20) at 300 min → `passiveWindow = 475`, estimate = 480 + max(0, 20 − 475) = 480 min shown in red |
| 3c | Pick one item with 30-min total at 30-min window → estimate = 30 min shown in green (≤75% = 22.5 min → amber zone; exactly 100% → amber) |
| 4 | Protein Waffles + Energy Balls + Flank Steak → shopping list aggregates correctly; same-ingredient rows from different items merge; pantry staples split into "Check Your Pantry" section |
| 5 | `npm run validate` exits 0 with full 30-item library |
| 7 | Sequencer unit tests pass; PRD §13 worked example produces correct step order |
| 8 | Happy path API call returns sequenced steps; Regenerate button disabled for 5s after click |
| 8 | Invalid API key on Preview deployment → toast appears, fallback sequencer output renders |
| 9 | Test on 375px (iPhone SE) and 1440px (desktop); all tap targets ≥44×44px |
| 10 | End-to-end smoke test on production Vercel URL |
