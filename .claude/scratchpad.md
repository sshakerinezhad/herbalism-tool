# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-12 (session 5)

## What was done

### Design System 2.0 (Piece 2.0) — COMPLETE

All 9 tasks executed. See `wave2.md` for full summary.

### Piece 2A — Profile & Navigation Restructure — NAVIGATION DONE, VISUAL PASS DEFERRED

Sessions 1-3: brainstorm. Session 4: plan. Session 5: implementation (14 tasks across 5 chunks, 9 commits).

**What shipped:** Persistent Ember & Silence nav bar with bonfire indicators, route group `(app)/` with centralized auth, profile-as-home with sub-tabs (Character|Inventory|Journal), herbalism hub, settings page with editable identity + delete character, forage/brew moved into route group, all stale route references updated.

**What's still in 2A scope but deferred (needs separate brainstorm):**
- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to profile/settings/character creation page content (pages moved as-is, no visual polish yet)

**Route structure:**
- `/` — Profile home (Character | Inventory | Journal sub-tabs)
- `/herbalism` — Hub with sessions, brews, quick links
- `/forage` — Forage page (in route group)
- `/brew` — Brew page (in route group)
- `/settings` — Settings (identity, character, stats, HP, account + delete)
- `/login` — Outside route group (no nav bar)
- `/create-character` — Outside route group (no nav bar)

## Current state

- **Build passes cleanly** — zero errors
- **Branch not yet merged** — still on `knights-of-belyar`
- **2A navigation work done** — deferred items still need brainstorming

## What the next session needs to do

1. **Manual testing** — verify all routes work with real data (`npm run dev`)
2. **Decide on deferred 2A items** — brainstorm those separately, or fold into 2B/later
3. **Brainstorm 2B** — Herbalism & Inventory piece (see `wave2.md`)
4. Or **merge branch** if testing looks good

## Key files

- **Wave 2 roadmap:** `.claude/wave2.md`
- **2A spec:** `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md`
- **Nav bar V3 mockup:** `.claude/ember-refined-v3.html`
- **Key new files:**
  - `src/app/(app)/layout.tsx` — Auth guard + NavBar
  - `src/app/(app)/page.tsx` — Profile home with sub-tabs
  - `src/app/(app)/herbalism/page.tsx` — Herbalism hub
  - `src/app/(app)/settings/page.tsx` — Settings with delete character
  - `src/components/NavBar.tsx` — Ember & Silence nav bar
  - `src/components/profile/` — CharacterSheet, InventoryPanel, JournalPanel
