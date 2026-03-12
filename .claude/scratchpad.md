# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-12 (session 5)

## What was done

### Design System 2.0 (Piece 2.0) — COMPLETE

All 9 tasks executed. See `wave2.md` for full summary.

### Piece 2A — Profile & Navigation Restructure — COMPLETE

Sessions 1-3: brainstorm. Session 4: plan. Session 5: implementation.

All 14 tasks executed. Persistent Ember & Silence nav bar, profile-as-home with sub-tabs, herbalism hub, settings page with editable identity + delete character, forage/brew in route group, all links updated.

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
- **All 2A work complete** — ready for manual testing or next piece

## What the next session needs to do

1. **Manual testing** — verify all routes work with real data (dev server)
2. **Brainstorm 2B** — Herbalism & Inventory piece
3. Or **merge branch** if testing looks good

## Open items (deferred — brainstorm separately)

- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to profile/settings page content

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
