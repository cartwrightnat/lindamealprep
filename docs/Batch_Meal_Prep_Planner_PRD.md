# PRD — Batch Meal Prep Planner

> For use with Claude Code in terminal.

---

## 1. What to Build

A website that turns a free time window into a complete batch prep session. The user picks items from a curated library of ~30 prep recipes, gets a shopping list with pantry-check flags, and receives an AI-generated sequenced game plan — what to start first, what runs in parallel, what goes in the fridge vs. freezer. The sequencing is the core product; everything else supports it.

---

## 2. Users & Scale

**Primary user: Emma.** Working parent, batch preps 1–2x per week, one person making all decisions and doing all the cooking. Device: laptop (primary), phone (secondary). Frequency: weekly.

**Secondary users: none in v1.** No sharing, no multi-user, no accounts.

**Scale assumptions (hard):** Single-user experience (no auth). Curated library of ~30 items stored as static JSON — no database. All user state (last selection) lives in browser local storage. No server-side persistence. Free hosting tier. No concurrent user considerations needed.

---

## 3. User Story

As a working parent who batch preps on weekends, I want to pick prep items that fit my available time and get a shopping list and AI-sequenced game plan, so that I can walk into my prep session without any planning overhead.

---

## 4. Walkthrough

### Emma (primary flow)

1. Emma opens the site. If she has a previous selection saved, a "Repeat last prep" button appears at the top.
2. She selects her available time from a dropdown (30–300 minutes in 30-minute increments).
3. She browses the curated item library, organised by category (breakfasts, snacks, proteins, sauces). As she selects items, a running session estimate updates and is labelled "approximate." She adds or removes items until she fits her window.
4. She clicks "Get Shopping List." The shopping list screen shows all ingredients split into two groups: **Buy** and **Check your pantry**. Matching ingredients across items are aggregated into a single line with summed quantity.
5. When ready, she clicks "See Game Plan." The site calls Claude, which returns a sequenced execution order: what to start first, what to run in parallel, when to switch tasks, what gets refrigerated vs. frozen. A loading state displays while the call is in progress.
6. If Emma changes her selections or her time window after viewing the game plan, a banner appears: "Selections changed — click to regenerate plan." The plan does not update automatically.
7. She follows the game plan. Next week she clicks "Repeat last prep" to restore her previous selection in one click.

**Navigation:** A persistent header shows three links at all times: Item Picker, Shopping List, Game Plan. Shopping List and Game Plan links are greyed out and non-clickable until at least one item is selected. On mobile, the header links stack vertically.

**Error / edge cases:**

- If the session estimate exceeds the time window, the site flags the overage in red with a single inline warning directly below the session estimate: *"Session estimate exceeds your time window. Consider removing [Item Name] to save [X] minutes."* The suggestion targets the item with the highest `totalMinutes`; X is the reduction in session estimate if that item is removed.
- If the Claude API call times out or fails at the network level, the site retries once after 2 seconds. If the response is a non-200 HTTP error, the site falls back immediately without retrying. If the retry also fails, a rule-based fallback plan renders with the banner: "Using simplified plan — AI unavailable. Review steps before starting."

---

## 5. Screens

Exactly three. If a feature isn't reachable from one of these, it's not in v1.

| # | Route | Audience | Purpose |
|---|-------|----------|---------|
| 1 | `/` | Emma | Item picker: select time window, browse library, select items, view running session estimate |
| 2 | `/shopping-list` | Emma | Generated shopping list split into Buy vs. Check pantry; aggregated by ingredient |
| 3 | `/game-plan` | Emma | AI-sequenced prep execution order; `totalHandsOnMinutes` displayed beneath the steps labelled "Active cooking time: X min"; stale banner on selection change or time window change. Before any plan is generated, displays a "See Game Plan" button and no steps. |

**Navigation:** Persistent header with three links. Shopping List and Game Plan are disabled until at least one item is selected.

---

## 6. Constraints

| Use | Avoid |
|-----|-------|
| Next.js 15 (App Router) | No other frameworks, no Pages Router |
| Claude API for sequencing (server-side only) | No other AI provider |
| Item library as static JSON file (`/data/library.json`) | No database or ORM |
| Browser local storage for "repeat last prep" | No server-side session or auth |
| Vercel for hosting | No other hosting |
| Tailwind CSS | No other CSS frameworks |

**Hard rules:**

- The `ANTHROPIC_API_KEY` MUST only be called server-side (Next.js server action or API route). It must never be exposed to the client.
- The Game Plan screen only regenerates on explicit user action (button click or "regenerate" banner click). It never auto-calls the API on selection change.
- The "selections changed" banner fires when the set of currently selected item IDs differs from the set of item IDs that produced the last generated plan, **or** when the current time window differs from the `planSourceTimeWindow` stored alongside the plan. Store both the plan's source item IDs and source time window in state. This prevents false positives from deselect/reselect actions.
- If `/shopping-list` or `/game-plan` is accessed directly with zero items in state, redirect to `/`.
- `handsonMinutes` drives sequencing and parallelisation logic. `totalMinutes` drives the session estimate. The two serve different purposes and must not be conflated.
- The item library is read-only in v1. There is no admin UI for adding or editing items.
- **API abuse (accepted v1 risk):** This is a single-user personal deployment with no public-facing discovery. The risk of API cost abuse is accepted for v1 without rate limiting. If the URL becomes public or shared, add per-IP rate limiting on the server action route before doing so.
- "Repeat last prep" uses browser local storage only. No server-side persistence of any user data. `lastPrep` is saved on "Get Shopping List" or "See Game Plan" click — not on every selection change.
- Selected items live in a React context provider. State persists across client-side route transitions (Item Picker → Shopping List → Game Plan and back). State resets on hard refresh. On hard refresh, any selections not yet committed to `lastPrep` will be lost — this is expected. Emma is prompted to restore via the "Repeat last prep" button, which reflects her last committed session.
- Shopping List and Game Plan nav links are disabled whenever zero items are selected, regardless of whether a game plan has previously been generated.

---

## 7. Done Means

**Functional:**

- [ ] Emma can select a time window and select items; the running session estimate updates correctly and is labelled "approximate."
- [ ] If the session estimate exceeds the time window, the overage is flagged in red and a removal suggestion is shown.
- [ ] The shopping list correctly splits ingredients into Buy vs. Check pantry using `isPantryStaple`, and aggregates matching ingredients (same name + same unit) into a single line with summed quantity.
- [ ] The rule-based fallback, given the three-item input in §13, produces steps in the order: Protein Waffles → Energy Balls → Flank Steak Marinade, with no equipment conflicts.
- [ ] The AI game plan screen renders valid steps and a `totalHandsOnMinutes` value for the §13 input.
- [ ] A loading state displays while the Claude API call is in progress.
- [ ] If the Claude API call times out or fails at the network level and the retry also fails, the rule-based fallback plan renders with the correct banner. If the response is a non-200 HTTP error, the fallback renders immediately without a retry. The fallback plan contains no equipment conflicts.
- [ ] Shopping List and Game Plan nav links are disabled until at least one item is selected.
- [ ] If selections change after a game plan is generated, the "Selections changed" banner appears. The plan does not auto-update.
- [ ] If the time window changes after a game plan is generated, the "Selections changed" banner also appears. The plan does not auto-update.
- [ ] All three screens are reachable via the header nav without resetting state or triggering unnecessary API calls.
- [ ] "Repeat last prep" correctly restores the previous item selection in one click.
- [ ] The worked example in §13 produces output matching the expected sequence.
- [ ] The Game Plan screen displays `totalHandsOnMinutes` beneath the steps, labelled "Active cooking time: X min." This is distinct from the session estimate shown on Screen 1.
- [ ] The site is usable at full width on a laptop. Screens reflow cleanly on a phone viewport with no horizontal scrolling.

**Behavioural:**

- [ ] Emma can go from opening the site to a complete shopping list in under 5 minutes.
- [ ] Emma can follow the game plan on her laptop without needing to re-read a step.

---

## 8. Out of Scope

- No user accounts, login, or server-side history
- No cross-device sync — local storage only
- No custom or user-uploaded recipes
- No dynamic sequencing of unknown or arbitrary recipes (curated library only)
- No advance-start sequencing — no items requiring kitchen preparation before the session begins. Items where all active work is completed within the session but which rest overnight before consumption (e.g. overnight oats, marinated proteins) are permitted; the game plan AI notes the overnight rest in the step's `note` field.
- No grocery delivery integration
- No live pantry inventory tracking
- No nutritional tracking or calorie counting
- No sharing, printing, or social features
- No admin UI for managing the item library
- No full week meal planning (Mode 2)
- No trip prep / advance handoff (Mode 3)

---

## 9. Notes for Future Extension

- **Custom recipes:** Requires the AI to extract and validate metadata (hands-on time, total minutes, equipment, storage) from an uploaded recipe before sequencing. The item schema in §11 is designed to accommodate this — no structural change needed.
- **Cross-device sync / accounts:** The local storage key (`lastPrep`) stores a JSON array of item IDs. This can be migrated to a server-side user record without changing the UI logic.
- **Advance-start sequencing:** Add `requiresAdvanceStart: boolean` to item metadata and a pre-session reminder screen. The library JSON structure has room for this field.
- **Shopping list sharing / print:** The shopping list data already exists client-side — no structural changes needed.
- **Aisle grouping on shopping list:** Add `aisle: string` to the `Ingredient` shape in §11 and enforce it in `validate-library.js`. The aggregation logic in `/lib/shopping.ts` already groups by ingredient — aisle grouping would be a second-level sort on top of that.
- **Mode 2 (weekly meal planning):** Builds on Mode 1. Item selection and sequencing logic is reusable; the planning horizon and output format change.
- **Mode 3 (trip prep):** Highest complexity. Requires freezer-first logic, quantity scaling, and a handoff document. Defer until Mode 2 is validated.

---

## 10. Environment Variables

```
ANTHROPIC_API_KEY=                        # Claude API key — server-side only, never exposed to client
CLAUDE_MODEL=claude-haiku-4-5-20251001    # Pinned model. Upgrade to claude-sonnet-4-6 if JSON reliability becomes an issue in testing.
```

---

## 11. Item Library Schema

The item library is a static JSON file at `/data/library.json`. No database. Each item has the following shape:

### Item fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique slug, e.g. `"energy-balls"` |
| `name` | string | Display name, e.g. `"Energy Balls"` |
| `category` | string | One of: `"breakfast"`, `"snack"`, `"protein"`, `"sauce"`, `"sides"`, `"treat"` |
| `handsonMinutes` | number | Active kitchen time in minutes — drives parallelisation logic |
| `totalMinutes` | number | Total elapsed session time including passive time (e.g. oven time) — drives session estimate |
| `equipment` | string[] | e.g. `["oven"]`, `["stovetop"]`, `[]` for no equipment |
| `ovenTemp` | number \| null | Oven temperature in °F. Required when `"oven"` is in equipment array; `null` otherwise |
| `storage` | string[] | One or more of: `"fridge"`, `"freezer"`, `"pantry"`. At least one value required. Include multiple when the item keeps well in more than one location (e.g. `["pantry", "freezer"]`). The game plan AI picks the most practical option per step and mentions alternatives in `note` if relevant. |
| `ingredients` | object[] | See ingredient shape below |
| `isPantryHeavy` | boolean | If true, the majority of the item's ingredients have `isPantryStaple: true`. This must hold — the `validate-library.js` script enforces it. Show note on shopping list. |

**Data quality rule:** Ingredient names must be normalised consistently across all library items. `"olive oil"` must appear identically in every item that uses it — never `"Olive Oil"`, `"extra-virgin olive oil"`, or `"evoo"` — to ensure correct aggregation on the shopping list.

### Ingredient shape

```json
{ "name": "rolled oats", "quantity": 2, "unit": "cup", "isPantryStaple": true }
```

### Full item example

```json
{
  "id": "energy-balls",
  "name": "Energy Balls",
  "category": "snack",
  "handsonMinutes": 20,
  "totalMinutes": 20,
  "equipment": [],
  "ovenTemp": null,
  "storage": ["fridge"],
  "isPantryHeavy": true,
  "ingredients": [
    { "name": "rolled oats", "quantity": 2, "unit": "cup", "isPantryStaple": true },
    { "name": "peanut butter", "quantity": 1, "unit": "cup", "isPantryStaple": true },
    { "name": "honey", "quantity": 0.5, "unit": "cup", "isPantryStaple": true },
    { "name": "dark chocolate chips", "quantity": 0.5, "unit": "cup", "isPantryStaple": false }
  ]
}
```

---

## 12. External Service Contracts

### AI Sequencing — Claude API

Called via a Next.js server action when Emma clicks "See Game Plan."

**Request sent to Claude:**

```json
{
  "timeWindowMinutes": 50,
  "selectedItems": [
    { "id": "flank-steak-marinade", "name": "Flank Steak Marinade", "handsonMinutes": 15, "totalMinutes": 15, "equipment": ["stovetop"], "ovenTemp": null, "storage": ["fridge"] },
    { "id": "protein-waffles", "name": "Protein Waffles", "handsonMinutes": 25, "totalMinutes": 25, "equipment": ["waffle-iron", "blender"], "ovenTemp": null, "storage": ["fridge", "freezer"] },
    { "id": "energy-balls", "name": "Energy Balls", "handsonMinutes": 20, "totalMinutes": 20, "equipment": [], "ovenTemp": null, "storage": ["fridge"] }
  ]
}
```

**System prompt:**

```
You are a meal prep sequencing assistant. Given a list of prep items and a time window,
produce a sequenced game plan for the kitchen session.

Rules:
- Sequence items to maximise parallel use of time.
- Equipment constraints:
  - Oven: only one oven item at a time, UNLESS two items have ovenTemp values within 25°F
    of each other — in that case, batch them together and note the midpoint temperature to use.
  - Stovetop: maximum two items simultaneously.
  - Mixer / waffle-iron / food processor / blender: one at a time (shared constraint —
    only one of these appliances running at once).
  - Slow cooker: one item at a time. Note: slow cooker items typically have
    totalMinutes > 300, which exceeds the time window dropdown maximum. They will always
    trigger the overage warning; this is expected and acceptable — Emma proceeds knowing
    the session runs longer.
  - Empty equipment array: can always run in parallel with any other task.
- Start the item with the highest totalMinutes first.
- For each step, note whether it can run in parallel with another task.
- If an item's `storage` array contains multiple options, prefer "freezer" for longest shelf
  life, then "fridge", then "pantry"; mention alternatives in `note` if relevant. Valid output
  values: "fridge", "freezer", "pantry". If only one option is provided, use it directly.
- Output ONLY valid JSON matching the structure below. No prose, no markdown, no explanation.
```

**Output structure:**

```json
{
  "steps": [
    {
      "order": 1,
      "item": "item name",
      "action": "short instruction (one sentence)",
      "storage": "fridge | freezer | pantry",
      "note": "optional: parallel observation or timing note"
    }
  ],
  "totalHandsOnMinutes": 0
}
```

`storage` is required on every step. `note` is optional and should only contain parallel or timing observations — not storage instructions.

`totalHandsOnMinutes` is the sum of `handsonMinutes` across all selected items — total active kitchen work, distinct from the session estimate.

**Failure handling (as implemented):** `src/app/api/sequence/route.ts` sets `export const maxDuration = 60;`, which is the only timeout bound on the Claude call — this is a platform-level (Vercel) execution limit, not an application-level request timeout. There is no `AbortController`, no client-side timeout, and no retry: a single call is made per "See Game Plan" / "Regenerate" click. If the call throws (network error, non-2xx from Claude) or the response is not valid JSON once markdown code fences are stripped, the route returns HTTP 500 with `{ "error": "AI sequencer unavailable" }`, and the client renders the rule-based fallback with the banner "AI unavailable — showing offline schedule (less detailed). Tap Regenerate to try again." A missing/blank `ANTHROPIC_API_KEY` is detected separately (`getConfigError`) and returns HTTP 503 with the banner "AI not configured — set ANTHROPIC_API_KEY in your environment variables, then tap Regenerate." Emma retries by tapping "Regenerate" manually; there is no automatic retry.

*(An earlier draft of this PRD specified a 12-second call timeout with one automatic retry after 2 seconds on a 5-second timeout, and a distinct `{ ok: false, reason: 'api_error' }` response shape. That behavior was never implemented; the text above reflects the current codebase. If the automatic-retry behavior is still wanted, it needs to be scoped and built as new work, with its worst-case retry budget kept under whatever `maxDuration` is set to.)*

**Rule-based fallback (client-side):** A deterministic sequencer applying the same equipment constraints as the system prompt. Algorithm: (1) sort items by `totalMinutes` descending, ties broken alphabetically; (2) maintain an equipment occupancy map with the same slot limits as the system prompt (oven: 1 unless batching; stovetop: 2; mixer/waffle-iron: 1; no equipment: unlimited); (3) assign each item to the earliest parallel slot where its equipment is not at capacity. This fallback must produce a plan with no equipment conflicts and is the acceptance criterion for the §7 fallback requirement. Fallback `action` field: populate each step using the template `"Prepare [item name] and store in the [storage]."`

---

## 13. Worked Example

Emma selects:

| Item | Hands-on | Total | Equipment | Oven temp | Storage |
|------|----------|-------|-----------|-----------|---------|
| Flank Steak Marinade | 15 min | 15 min | stovetop | — | fridge |
| Protein Waffles | 25 min | 25 min | waffle-iron, blender | — | fridge, freezer |
| Energy Balls | 20 min | 20 min | none | — | fridge |

**Time window:** 50 minutes.

**Session estimate:** Applying the formula from §14: **60 min** — labelled "approximate." Overage flag triggers (60 > 50). Removal suggestion: remove Protein Waffles (highest `totalMinutes` at 25 min). Emma proceeds without removing.

*Calculation: max(25, 20, 15) = 25; passiveWindow = 25 − 25 = 0; sum of other handsonMinutes = 20 + 15 = 35; estimate = 25 + max(0, 35 − 0) = 60.*

**Expected AI output (assuming Emma proceeds):**

```json
{
  "steps": [
    {
      "order": 1,
      "item": "Protein Waffles",
      "action": "Blend the batter and begin cooking waffles in batches.",
      "storage": "freezer",
      "note": "Highest total session time — start here. Can also be stored in the fridge for up to 5 days."
    },
    {
      "order": 2,
      "item": "Energy Balls",
      "action": "While waffles cook, mix and roll the energy balls.",
      "storage": "fridge",
      "note": "No equipment needed — runs in parallel with waffles."
    },
    {
      "order": 3,
      "item": "Flank Steak Marinade",
      "action": "Mix marinade ingredients, coat the steak, and place in the fridge.",
      "storage": "fridge",
      "note": "Stovetop is free — fits within the waffle-cooking window."
    }
  ],
  "totalHandsOnMinutes": 60
}
```

**Note:** In this example, session estimate and `totalHandsOnMinutes` happen to be equal (60 min). They match because none of the items have passive time — every minute of total time is also hands-on time, so there is no passive window to absorb parallel work. In most sessions (where at least one item has oven or rest time) they will differ.

**What this proves:**
- Item with highest `totalMinutes` starts first
- No-equipment item slotted into a parallel gap
- Stovetop task runs concurrently with waffle-iron (different equipment slots)
- Multi-option storage resolved to preferred value (`"freezer"`) with alternative noted
- Session estimate formula correctly calculates 60 min when passiveWindow = 0

---

## 14. Domain Rules

### Time rule

- `totalMinutes` = total elapsed session time including passive time. Used for the session estimate Emma sees.
- `handsonMinutes` = active kitchen work only. Used to drive parallelisation logic in the sequencer.
- **Session estimate formula:** `max(totalMinutes) + max(0, sum(handsonMinutes of all other selected items) − passiveWindow)`, where `passiveWindow = totalMinutes − handsonMinutes` of the item with the highest `totalMinutes`. Label as "approximate" in the UI.
- **Time window input:** Dropdown only — 30 to 300 minutes in 30-minute increments. No free-text entry.
- **Overage:** If session estimate exceeds the time window, flag in red and suggest removing the item with the highest `totalMinutes`. If two items share the highest `totalMinutes`, suggest removing the one that appears last alphabetically — consistent with the fallback algorithm's tie-breaking convention. This convention matches the fallback sort order in §12 — §12 is the authoritative source. If overage persists after the suggested item is removed, re-evaluate the new selection and flag again using the same logic.

### Equipment rules

Equipment constraints live in §12 (AI system prompt and rule-based fallback). Do not duplicate them here. §12 is the single source of truth.

### Pantry staple rule

- Ingredient `isPantryStaple: true` → **Check your pantry** section of the shopping list.
- Ingredient `isPantryStaple: false` → **Buy** section.
- If one or more selected items have `isPantryHeavy: true` → shopping list shows a single banner once (not per item): *"One or more items are pantry-heavy — verify staples before you shop."*

### Shopping list aggregation rule

- Same ingredient name + same unit → sum quantities into a single line.
- Same ingredient name + different units → keep as separate lines. Do not attempt unit conversion.
- Conflicting `isPantryStaple` values for the same ingredient across items → treat as `false` (Buy). Safer to prompt Emma to buy than to assume she has it.

---

## 15. Build Order

1. **Scaffold:** Create Next.js 15 site with Tailwind. Confirm Vercel deployment works with a placeholder home page.
2. **Library (5 items):** Create `/data/library.json` with 5 real items covering at least 3 categories. Validate JSON shape matches §11, including `totalMinutes` and `ovenTemp`.
3. **Item picker (Screen 1):** Time window dropdown (30–300 min, 30-min increments), item browsing by category, selection, running session estimate labelled "approximate." Overage warning. Wire to library JSON. Verify session estimate calculation.
4. **Shopping list (Screen 2):** Generate from selected items. Split Buy vs. Check pantry. Aggregate matching ingredients. Verify against at least 2 item combinations.
5. **Library completion:** Expand to ~30 items. Write a `validate-library.js` script that checks:
   - (a) All required fields present and correctly typed per §11
   - (b) Ingredient names are lowercase and consistent across all items (no duplicate names in different forms)
   - (c) If `"oven"` is in equipment, `ovenTemp` must be a number (not `null`)
   - (d) `category` is one of: `"breakfast"`, `"snack"`, `"protein"`, `"sauce"`, `"sides"`, `"treat"`
   - (e) For every item where `isPantryHeavy: true`, the majority of its ingredients have `isPantryStaple: true`
   - (f) Each item's `storage` array must contain at least one value and every entry must be one of `"fridge"`, `"freezer"`, or `"pantry"`

   All checks are hard gates — do not proceed to step 6 if any fail.

6. **Repeat last prep:** Save item IDs to local storage key `lastPrep` when Emma clicks "Get Shopping List" or "See Game Plan" — not on every selection change. On site load, show "Repeat last prep" button if key exists. Verify it correctly restores the selection in one click.
7. **AI game plan (Screen 3):** Server action calls Claude API with selected items and time window. Renders sequenced steps with loading state. Stale banner displays on selection change or time window change. Verify output matches §13 worked example.
8. **Rule-based fallback:** Implement client-side sequencer applying §12 equipment constraints. Test that it produces a plan with no equipment conflicts. Verify fallback banner text and retry logic (retry once after 2 seconds on timeout/network failure; immediate fallback on non-200).
9. **Responsive check:** Verify all three screens reflow correctly on a phone viewport. Fix any layout breaks. Tap targets and text size are nice-to-have, not blocking.
10. **Deploy:** Final Vercel deployment. Smoke-test the full flow end-to-end.
