# Batch Meal Prep Planner — Design System Spec

*v1.1 · June 2026*

---

## Design principles

| # | Principle | What it means in practice |
|---|-----------|--------------------------|
| 1 | **Content first** | Recipe names, steps, and times *are* the product. UI chrome recedes. |
| 2 | **Warm, not slick** | Feels like a cookbook handed to a friend. Serif headlines, off-white paper, terracotta accent. Not a productivity dashboard. |
| 3 | **Mobile first** | Every component designed thumb-first (min 44px tap targets), scales to desktop. |
| 4 | **Reduce load** | The whole point is to remove cognitive load from Emma. UI must never add any back. |

**References:** NYT Cooking, Epicurious  
**Avoid:** dashboard chrome, sidebars, dark mode by default, generic card grids with heavy shadows

---

## Colour

Colours use a named two-word convention: `--color-[group]-[variant]`. All values are CSS custom properties defined on `:root`.

### Background & surface

| Token | Hex | Use |
|-------|-----|-----|
| `--color-paper` | `#F9F5EE` | Page background. Warm off-white, like cookbook paper. |
| `--color-surface` | `#F2EBE0` | Slightly darker cream. Section backgrounds, inputs. |
| `--color-surface-warm` | `#EDE3D5` | Image placeholder backgrounds, hovered surfaces. |
| `--color-cream` | `#FFF8F2` | Cards, modal backgrounds, the warmest white. |

### Ink (text)

| Token | Hex | Use |
|-------|-----|-----|
| `--color-ink` | `#1C1C17` | Primary text. Near-black with a warm undertone — never pure `#000`. |
| `--color-ink-muted` | `#6B6558` | Secondary text, captions, metadata. |
| `--color-ink-faint` | `#A8A096` | Placeholders, disabled labels, timestamps. |

### Spice — primary accent

Terracotta/brick. Used for: primary buttons, selected states, active navigation, time badges, the spice accent throughout. Named "spice" to keep the food metaphor in the codebase.

| Token | Hex | Use |
|-------|-----|-----|
| `--color-spice` | `#C24E1A` | Primary CTAs, selected borders, active nav. |
| `--color-spice-dark` | `#A63D12` | Hover/pressed state on spice elements. |
| `--color-spice-light` | `#F5EDE7` | Focus rings, badge backgrounds, tinted highlights. |

### Herb — secondary accent

Sage/olive green. Used for: confirmation states, freezer-friendly tags, pantry checkboxes. Signals "done" or "safe".

| Token | Hex | Use |
|-------|-----|-----|
| `--color-herb` | `#4A6741` | Herb buttons, checked shopping items. |
| `--color-herb-dark` | `#3A5232` | Hover state. |
| `--color-herb-light` | `#EDF2EB` | Tag backgrounds, tinted confirmation areas. |

### Border

| Token | Hex | Use |
|-------|-----|-----|
| `--color-border` | `#E4DDD3` | Default border on all cards and inputs. |
| `--color-border-strong` | `#C8BEB2` | Hover borders, stronger dividers, checkbox borders. |

---

## Typography

### Typefaces

```
--font-serif: 'Lora', Georgia, 'Times New Roman', serif
--font-sans:  'Inter', system-ui, -apple-system, sans-serif
```

Both loaded from Google Fonts. Fallback chain works without internet.

**Rule:** Serif (Lora) is for headings and display moments only. Never use it in buttons, labels, inputs, or navigation. Inter handles all UI.

### Type scale

| Role | Font | Size | Weight | Line height | Usage |
|------|------|------|--------|-------------|-------|
| Display | Lora | 48px / 3rem | 600 | 1.2 | Screen titles, hero moments |
| Heading 1 | Lora | 36px / 2.25rem | 600 | 1.35 | Page headings |
| Heading 2 | Lora | 28px / 1.75rem | 600 | 1.35 | Section headings |
| Heading 3 | Lora | 22px / 1.375rem | 500 | 1.35 | Sub-sections, card titles |
| UI Large | Inter | 18px / 1.125rem | 500 | 1.5 | Prominent UI labels |
| Body | Inter | 16px / 1rem | 400 | 1.7 | Body copy, instructions |
| UI Small | Inter | 14px / 0.875rem | 400 | 1.5 | Metadata, captions |
| Label / Cap | Inter | 12px / 0.75rem | 600 | 1.5 | ALL CAPS labels, +0.1em tracking |
| Serif italic | Lora italic | 18px / 1.125rem | 400 | 1.5 | Intro text, editorial moments |

### CSS tokens

```css
--text-xs:      0.75rem;   /* 12px */
--text-sm:      0.875rem;  /* 14px */
--text-base:    1rem;      /* 16px */
--text-md:      1.125rem;  /* 18px */
--text-lg:      1.375rem;  /* 22px */
--text-xl:      1.75rem;   /* 28px */
--text-2xl:     2.25rem;   /* 36px */
--text-display: 3rem;      /* 48px */

--leading-tight:  1.2;
--leading-snug:   1.35;
--leading-normal: 1.5;
--leading-loose:  1.7;
```

---

## Spacing

4px base unit. Never use arbitrary values — always use a token.

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px   /* card padding, form field padding */
--space-5:  20px
--space-6:  24px   /* gap between list items, section sub-gaps */
--space-8:  32px
--space-10: 40px
--space-12: 48px   /* major section breaks */
--space-16: 64px   /* page section gaps */
--space-20: 80px   /* hero padding */
```

**Common patterns:**

- Card body padding: `--space-4`
- Gap between cards in a grid: `--space-4`
- Section heading to content: `--space-8`
- Between major page sections: `--space-12` to `--space-16`
- Page horizontal padding (mobile): `--space-6` (24px each side)

---

## Border radius

```css
--radius-sm:   3px      /* checkboxes, small labels */
--radius-md:   8px      /* inputs, steps, small cards */
--radius-lg:   14px     /* prep item cards, shopping list */
--radius-xl:   20px     /* large modals */
--radius-full: 9999px   /* pills, buttons, circular elements */
```

Buttons always use `--radius-full` (pill shape). Cards use `--radius-lg`. Inputs use `--radius-md`.

---

## Shadows

Warm-tinted, intentionally minimal. Shadow colour is `rgba(28,28,23,N)` — the ink colour at low opacity, not cool gray.

```css
--shadow-xs: 0 1px 2px rgba(28,28,23,0.06)   /* barely-there lift */
--shadow-sm: 0 1px 4px rgba(28,28,23,0.08)   /* default card lift */
--shadow-md: 0 2px 8px rgba(28,28,23,0.10)   /* floating elements */
--shadow-lg: 0 4px 16px rgba(28,28,23,0.12)  /* modals, sheets */
```

**Rule:** Most components use no shadow at all — they rely on `--color-border` instead. Max `shadow-md` for sticky/floating elements. `shadow-lg` only for full-screen overlays.

---

## Components

### Buttons

All buttons: `--radius-full`, `font-family: var(--font-sans)`, `font-weight: 500`, `min-height: 44px`.

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary | `--color-spice` | White | `--color-spice` | One per screen. The main action. |
| Secondary | Transparent | `--color-ink` | `--color-border-strong` | Alternative or cancel action. |
| Ghost | Transparent | `--color-spice` | None | Inline nav, "view all" links. |
| Herb | `--color-herb-light` | `--color-herb-dark` | None | Confirmation states ("Pantry item ✓"). |
| Disabled | — | — | — | Any variant at `opacity: 0.38`. |

Sizes: `lg` (48px height, body text), `md` (40px height, sm text), `sm` (32px height, xs text).

### Inputs

- Background: `--color-cream`
- Border: `1.5px solid --color-border`
- Focus: border becomes `--color-spice`, ring is `0 0 0 3px --color-spice-light`
- Error: border `#D04020`, ring `rgba(208,64,32,0.12)`
- Placeholder: `--color-ink-faint`
- Border radius: `--radius-md`
- Min height: 44px (padding 11px top/bottom)

### Checkboxes

Custom-styled. 20×20px, `--radius-sm` (square feel, not round). Checked state: `--color-spice` fill with white checkmark. Shopping list uses round checkboxes (`--radius-full`) in `--color-herb` to signal "done, moving on".

### Tags & Badges

All pills (`--radius-full`), `font-size: --text-xs`, `font-weight: 500`.

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| Spice | `--color-spice-light` | `--color-spice-dark` | Time, active filters |
| Herb | `--color-herb-light` | `--color-herb-dark` | Freezer-friendly, confirmed |
| Neutral | `--color-surface` | `--color-ink-muted` | Category, storage info |
| Ink | `--color-ink` | `--color-cream` | "New", priority flags |

### Prep Item Card

The core unit of the library screen.

```
┌─────────────────────────────┐
│ Image (3:2 ratio)           │  ← No shadow on image
├─────────────────────────────┤
│ CATEGORY (caps, faint)      │
│ Recipe name (serif, md)     │
│ ⏱ 15 min · Makes 6 · tag   │
└─────────────────────────────┘
```

- Background: `--color-cream`
- Border: `1px solid --color-border`
- Radius: `--radius-lg`
- Selected state: border `--color-spice` + `box-shadow: 0 0 0 2px --color-spice-light` + checkmark badge top-right
- Hover: border → `--color-border-strong`
- No heavy drop shadows

### Time Budget Bar

Shows session estimate vs. time window. Three visual states:

| State | Fill colour | Note colour |
|-------|------------|-------------|
| ≤ 75% | `--color-spice` | Neutral message |
| 76–100% | `#D4840A` (amber) | "Getting tight" |
| > 100% | `#D04020` (red) | "Remove an item" |

Track background: `--color-surface`. Track height: 8px, `--radius-full`.

The `> 100%` state fires at the same threshold as the PRD's inline overage warning — one condition, two surfaces.

### Header Navigation

Three destinations: **Item Picker** (`/`) · **Shopping List** (`/shopping-list`) · **Game Plan** (`/game-plan`).

- Background: `--color-paper`
- Bottom border: `1px solid --color-border`
- Active link: `--color-spice`, font-weight 500
- Inactive link: `--color-ink-muted`
- Disabled link (Shopping List and Game Plan when no items selected): `--color-ink-faint`, `pointer-events-none`, `aria-disabled="true"`
- Font: Inter (never Lora — navigation is UI, not editorial)
- On mobile: links stack vertically, full-width tap targets, min 44px height each
- No sidebar, no hamburger, no drawer

### Shopping List

Two sections: **Buy** and **Check your pantry** (per PRD §14 pantry staple rule). Pantry staples are a separate group with a "Pantry" badge — Emma confirms these rather than buying.

- Container: `--radius-lg` border, `--color-cream` background
- Section headers: `--color-surface` background, `--text-xs` caps
- Item rows: 48px min height, `--space-4` padding
- Check circles: `--radius-full`, herb colour when checked (signals "acquired", not just "read")

### Prep Steps

Sequenced execution order. Each step is a numbered card displayed in the AI-generated order. Steps are display-only — there is no interactive completion tracking in v1.

- Step number: Lora, `--text-lg`, `--color-spice`
- Step card: `--color-cream` background, `1px solid --color-border`, `--radius-md`
- Step body text: Inter body, `--color-ink`
- Note text (parallel/timing observations): Inter, `--text-sm`, `--color-ink-muted`, italic
- Storage badge: Neutral tag variant
- Timer tag appears inside step when a wait is noted

### Toast Messages

- Background: `--color-ink`
- Text: `--color-cream`
- Action link: `--color-spice-light`, underlined
- Radius: `--radius-full` (pill)
- Position: bottom of screen
- Duration: 3–4s auto-dismiss

---

## Motion

- Default transition: `0.15s ease` on colour, border, opacity
- Budget bar fill: `0.3s ease` on width (satisfying feedback as Emma adds items)
- No bounce, no spring, no delayed entrance animations
- Respect `prefers-reduced-motion`: all transitions off

---

## Accessibility

- All interactive elements: min 44×44px tap target
- Focus states: always visible (spice ring on inputs, outline on buttons)
- Colour is never the sole indicator of state — always paired with label or icon
- Text contrast: ink on paper (≥ 7:1), ink-muted on paper (≥ 4.5:1)

---

## What this system deliberately avoids

- Dark mode (not relevant to Emma's use context; adds significant design surface for no gain)
- Sidebars or horizontal navigation
- Heavy card shadows or glassmorphism
- Generic grid layouts with uniform cards and no typographic hierarchy
- Blue as a primary colour (too generic, too "app")
- Condensed type or tight line spacing (readability in the kitchen matters)

---

*Design system spec · Batch Meal Prep Planner · v1.1 · June 2026*
