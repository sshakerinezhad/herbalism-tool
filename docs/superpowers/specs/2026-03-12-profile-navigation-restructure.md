# 2A: Profile & Navigation Restructure — Design Spec

**Status:** BRAINSTORM IN PROGRESS (nav bar visual polish + remaining design items)
**Date:** 2026-03-12
**Wave:** 2A per `.claude/wave2.md`

---

## Overview

Replace the hub-and-spoke navigation model (home page card grid → standalone pages → "← Home" breadcrumbs) with a persistent top navigation bar and profile-as-home architecture.

## Decisions Made

### 1. Navigation Model: Persistent Top Nav + Sub-tabs

**Two-level navigation:**
- **Top level (persistent):** Subsystem tabs visible on every page
- **Second level (Profile only):** Sub-tabs for Character / Inventory / Journal

The top nav persists across ALL pages including /forage, /brew, etc.

### 2. Tab Structure

**Top-level tabs:**

| Tab | Behavior | Status |
|-----|----------|--------|
| Profile | Default. Renders sub-tab content inline. | Active (2A) |
| Herbalism | Navigates to `/herbalism` hub page | Active (2A) |
| Martial Mastery | Placeholder | Locked (Wave 3) |
| Archemancy | Placeholder | Locked (Wave 3) |
| Alchemy | Placeholder | Locked (future) |

**Profile sub-tabs (embedded content):**

| Sub-tab | Content |
|---------|---------|
| Character | Character sheet (banner, stats, vitals, skills, equipment, appearance) |
| Inventory | Equipment, herbs, brewed items, quick slots, coin purse |
| Journal | Recipes + order lore + special rules + spells (new concept) |

### 3. Feature Page Routing (Hybrid Approach)

- **Embedded as sub-tabs:** Character sheet, Inventory, Journal
- **Standalone pages:** Forage (`/forage`), Brew (`/brew`) — these are multi-step workflows
- **New hub page:** Herbalism (`/herbalism`) — overview with foraging sessions left, recent brews, quick links to /forage and /brew

### 4. Settings: Merged Single Page

Replace `/edit-character` with `/settings`. One page for everything:

**Sections:**
- **Identity** — race, class, background, order, vocation (newly editable, with confirmation warning since changes have cascading effects)
- **Character** — name, level, appearance
- **Stats** — STR, DEX, CON, INT, WIS, CHA, HON
- **HP & Money** — current HP, custom modifier, platinum/gold/silver/copper
- **Account** — sign out, delete character

**Key changes from current /edit-character:**
- Identity fields UNLOCKED (currently read-only)
- Armor editing REMOVED (moves to Inventory tab)
- Delete character added (full nuke — see Decision 7)
- Access via gear icon (⚙) in the persistent top nav

### 5. Nav Bar Visual Design: "Ember & Silence" — APPROVED (V3)

**Philosophy:** Elden Ring restraint + BG3 warmth. The nav barely exists. What's there glows with purpose.

**Palette (V3 — "Medium Lift +"):**
```
--void: #181614      (page bg, ~10% brightness)
--ink: #1e1b18       (card surfaces)
--char: #24211c      (raised surfaces)
--soot: #38322a      (dark accents)
--deep-ash: #5c5347  (secondary text, section heads)
--ash: #877b6e       (inactive tab text, subtitles)
--ash-light: #a49888 (hover states)
--warm-white: #ede4d3 (primary text)
--warm-mid: #c4b8a4  (active sub-tabs, stat values)
```
Original palette was 2-5% brightness (invisible). V3 sits at 10-20% — dark fantasy with real contrast.

**Design language:**
- **Character presence (left):** 38px rounded-square emblem (obsidian gradient with bronze inset glow), character name in Grenze Gotisch **21px**, subtitle in Cinzel **10.5px** uppercase `--ash` color, 2px tracking. Ambient warmth radial gradient radiates outward.
- **The ember line:** Single 1px bottom border. Full bronze at character side, gradient-fading right. Character IS the warmth source.
- **System tabs (center):** Cinzel **11.5px**, 1.8px tracking, uppercase. `--ash` (#877b6e) for inactive. `--ember-bright` for active. **8px gap** between tabs.
- **Active indicator — BONFIRE EFFECT:** 4-layer CSS effect wreathing the active tab in ember glow (Dark Souls bonfire vibe):
  1. Text glows warm via `text-shadow` (multi-radius, breathing animation)
  2. Background `linear-gradient(to top)` — heat shimmer rising from below
  3. `::before` — wide ambient warmth pool (radial gradient, breathing)
  4. `::after` — concentrated 24px ember core at bottom with layered `box-shadow` glow, width oscillates 22-28px organically
  All 4 layers breathe at 4s cycle with staggered intensities.
- **Each subsystem gets its own bonfire color:** Profile = bronze (#e8b44c core), Herbalism = green (#7db86a core), etc.
- **Locked tabs:** Dim but visible (#342e26), 10.5px. Tooltip on hover.
- **HP indicator (right):** 6px green ember, breathing 3.5s cycle. Numbers slide in on hover.
- **Gear icon (right):** `--ash` color, **20px**, rotates 30° on hover with ember glow.
- **Nav bar:** 56px height, **20px horizontal padding**.
- **Hover transitions:** All use `cubic-bezier(0.23, 1, 0.32, 1)` for organic feel. 0.4-0.6s durations.

**Sub-tabs (Profile page only):**
- Almendra **14px** (body font, not Cinzel — secondary to system tabs)
- `--ash` inactive, `--warm-mid` active
- 8px vertical padding, whisper bottom line
- Offset left to align with content, not the nav edge

**Reference mockup:** `.claude/ember-refined-v3.html` (approved V3 with all final values)

**STATUS: APPROVED.** User confirmed V3 on 2026-03-12 session 3.

### 6. Locked Tab Behavior: Tooltip on Hover

When hovering a locked tab (Martial Mastery, Archemancy, Alchemy), a small tooltip fades in with flavor text (e.g., "Coming soon... The blade remembers."). No click handler. Tooltip uses the same organic `cubic-bezier(0.23, 1, 0.32, 1)` easing as other nav transitions. Each locked tab gets its own flavor text. Maximum restraint — present but silent.

### 7. Delete Character Flow: Full Nuke

Settings page includes a "Delete Character" button. Clicking opens a confirmation modal:
- Warning: "This will PERMANENTLY DELETE your character and ALL data."
- User must type "DELETE" to confirm
- On confirm: DELETE the character row from DB, redirect to `/create-character`
- True fresh start — no partial reset option

### 8. Journal Tab: Recipes Only (2A)

The Journal sub-tab contains the existing `/recipes` page content re-parented. Named "Journal" (not "Recipes") to signal future expansion into lore/rules/spells, but for 2A scope it is exclusively recipes. Same data model, same UI — just moved into a sub-tab.

### 9. Architecture: Route Group Layout

Use Next.js App Router route groups to separate authenticated pages from public pages:

```
src/app/
├── layout.tsx              (root: fonts, providers — unchanged)
├── login/page.tsx          (no nav bar)
├── create-character/       (no nav bar)
│
└── (app)/                  ← route group for authenticated pages
    ├── layout.tsx          ← NavBar + auth guard
    ├── page.tsx            ← Profile (home)
    ├── settings/page.tsx   ← new (replaces edit-character)
    ├── herbalism/page.tsx  ← new hub
    ├── forage/page.tsx     ← moved from root
    └── brew/page.tsx       ← moved from root
```

**Why route groups:** The `(app)/layout.tsx` renders the NavBar. Because Next.js layouts persist across navigations (they don't remount), the Ember & Silence breathing animations and hover states survive page transitions. This is critical for a nav designed around ambient animation. Auth guard is also centralized here instead of duplicated in every page.

**Sub-tabs are client state:** Profile sub-tabs (Character/Inventory/Journal) use the existing Tabs component with React state. No URL query params — this is a character tool, not a deep-linkable web app.

## Route Changes

| Current | New | Notes |
|---------|-----|-------|
| `/` (hub page) | `/` (profile page) | Profile becomes home |
| `/profile` | Removed or redirects to `/` | Merged into home |
| `/edit-character` | `/settings` | Merged + expanded |
| — | `/herbalism` | New hub page |
| `/forage` | `/forage` | Unchanged (standalone) |
| `/brew` | `/brew` | Unchanged (standalone) |
| `/recipes` | Removed | Absorbed into Journal sub-tab |
| `/inventory` | Removed | Absorbed into Inventory sub-tab |
| `/create-character` | `/create-character` | Unchanged |
| `/login` | `/login` | Unchanged |

## Open Items (for next session)

1. **Character bar improvements** — wave2.md mentions "animation/modal popups explaining traits" and "skill proficiencies in character bar" — needs design
2. **Mobile responsive** — how does the nav collapse on small screens?
3. **Character creation wizard** — needs design system restyling (wave2.md scope)
4. **Design system application** — profile, settings pages need Wave 2.0 visual treatment

### Resolved
- ~~Nav bar visual polish~~ → V3 approved with bonfire effect (Decision 5, session 3)
- ~~Placeholder tab design~~ → Tooltip on hover (Decision 6, session 2)
- ~~Reset character flow~~ → Full delete + re-create (Decision 7, session 2)
- ~~Journal tab content~~ → Recipes only for 2A (Decision 8, session 2)
- ~~Approach options~~ → Route group layout (Decision 9, session 2)

## Visual Mockups

Nav bar mockups in `.claude/`:
- `Ember & Silence — Refined.html` — V1 original (too dark, too small)
- `ember-refined-v2.html` — V2 palette lift (medium brightness)
- `ember-refined-v3.html` — **APPROVED: V3 with bonfire effect, final palette, sizing**

Earlier brainstorm mockups in `.superpowers/brainstorm/`:
- `navigation-model.html` — initial wireframes (3 nav models)
- `nav-bar.html` — first wireframe pass
- `nav-bar-v2.html` — styled wireframes (Codex/Spellbook/Chronicle)
- `nav-bar-v3.html` — artistic pass (Codex/Spellbook/Chronicle with real CSS)
- `nav-bar-v4.html` — philosophy pass (Ember & Silence / Gilt-Edge / Living Manuscript)
