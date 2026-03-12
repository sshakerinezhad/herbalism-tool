# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-12 (session 4)

## What was done

### Design System 2.0 (Piece 2.0) — COMPLETE

All 9 tasks executed. See `wave2.md` for full summary.

### Piece 2A Brainstorm — COMPLETE

Sessions 1-3 resolved all major decisions. Session 4 wrote the implementation plan.

**Brainstorm checklist:**
1. ✅ Explore project context
2. ✅ Visual companion (sessions 1 + 3)
3. ✅ Clarifying questions resolved
4. ✅ Approach chosen (route group layout)
5. ✅ Design sections approved (remaining items deferred to separate brainstorm)
6. ✅ Final spec exists at `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md`
7. ✅ Implementation plan written (session 4)

### Piece 2A Implementation Plan — WRITTEN (session 4)

Wrote full 14-task plan across 5 chunks. Plan is at `.claude/work-plan.md`.

**Plan summary (14 tasks, 5 chunks):**
1. **CSS Foundation** — V3 palette tokens + bonfire keyframes in globals.css
2. **NavBar Component** — Ember & Silence nav bar matching approved V3 mockup
3. **Tab Variant** — Add `variant="sub"` to Tabs component for profile sub-tabs
4. **Extract CharacterSheet** — from profile page into `src/components/profile/`
5. **Extract InventoryPanel** — from inventory page
6. **Extract JournalPanel** — from recipes page + barrel export
7. **Route Group Layout** — `(app)/layout.tsx` with auth guard + NavBar
8. **Profile Home** — sub-tabs (Character|Inventory|Journal) + delete old pages
9. **Move Forage/Brew** — into route group (strip auth guards)
10. **Herbalism Hub** — new `/herbalism` page with overview + links
11. **Settings Page** — replaces /edit-character, identity fields unlocked
12. **Delete Character** — type "DELETE" confirmation flow in settings
13. **Link Cleanup** — update all route references
14. **Verification** — build check + manual testing + update docs

## Current state

- **Build passes cleanly** — zero errors
- **Branch not yet merged** — still on `knights-of-belyar`
- **Plan ready to execute** — `.claude/work-plan.md` has the full implementation plan
- **No code changes this session** — session 4 was planning only

## What the next session needs to do

1. **Execute the plan** — invoke `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement `.claude/work-plan.md`
2. **Run `/verify` first** if following CLAUDE.md verification protocol
3. **After completion:** Update `wave2.md` and `scratchpad.md`, then brainstorm remaining Wave 2 items

## Open items (deferred — brainstorm separately after 2A implementation)

- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to profile/settings page content

## Key files

- **Implementation plan:** `.claude/work-plan.md`
- **2A spec:** `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md`
- **Nav bar V3 mockup:** `.claude/ember-refined-v3.html` (APPROVED — reference for NavBar implementation)
- **Wave 2 roadmap:** `.claude/wave2.md`
- **Key source files to modify/extract from:**
  - `src/app/globals.css` — add V3 tokens + keyframes
  - `src/components/ui/Tabs.tsx` — add variant prop
  - `src/app/profile/page.tsx` — extract CharacterSheet
  - `src/app/inventory/page.tsx` — extract InventoryPanel
  - `src/app/recipes/page.tsx` — extract JournalPanel
  - `src/app/edit-character/page.tsx` — reference for settings page
  - `src/lib/db/characters.ts:312` — deleteCharacter() already exists
