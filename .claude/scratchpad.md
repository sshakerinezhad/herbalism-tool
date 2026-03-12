# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-12 (session 9 — planning only)

## Prior uncommitted work (session 8)

The full 2A Visual Pass is implemented but **still uncommitted**. All changes listed below are sitting in the working tree:
- 4 new files: `Textarea.tsx`, `SkillsPanel.tsx`, `ChapterProgress.tsx`, `SelectionCard.tsx`
- 12 modified files across Settings, Wizard, Profile, db, hooks
- Build was passing as of session 8. Needs commit + visual testing.

## What was done this session (session 9)

**Planning session only — no code changes.** Investigated 3 user-reported issues and designed fixes:

### 1. Brewing bug (confirmed)
- **Root cause:** `src/lib/hooks/useBrewState.ts` ~line 380 — `count: count * batchCount` multiplies effect potency by batch count. "Brew 3 single-power" becomes "1 triple-power × dice results."
- **Fix:** Remove `* batchCount` — batch count already controls repetition at the DB layer.

### 2. CoinPurse debounce (confirmed)
- **Root cause:** `src/components/character/CoinPurse.tsx` — no pending state guard, so rapid clicks fire concurrent async DB calls that race. The `useEffect` on `propCoins` can reset optimistic state mid-flight.
- **Fix:** Add `pendingCoin` state to block concurrent mutations + guard the useEffect sync.

### 3. Add Elixir feature (new)
- User wants to manually add elixirs from known recipes (not free-text).
- **New file:** `AddElixirModal.tsx` in `src/components/inventory/herbalism/` — mirrors AddHerbModal pattern.
- Pick from unlocked recipes → set potency (1–4) → handle template variable choices → set quantity → calls existing `addCharacterBrewedItem()`.
- Reuses: `parseTemplateVariables` + `fillTemplate` from `src/lib/brewing.ts`, `useCharacterRecipes` hook, `addCharacterBrewedItem` from `characterInventory.ts`.

### 4. Honour stat — already works
- User didn't realize honour is already editable on Settings page. No changes needed.

## Current state

- **Work plan written** at `.claude/work-plan.md` — covers all 3 items above
- **No code changes made this session** — plan mode only
- **Prior 2A visual pass still uncommitted**

## What the next session needs to do

1. **Commit the 2A visual pass first** (large commit, all uncommitted changes from session 8)
2. **Implement work plan** — 3 items in order:
   - Brewing bug fix (1 line)
   - CoinPurse debounce (~15 lines)
   - AddElixirModal (new file + 2 modified files)
3. **Verify:** `npm run build` + manual testing per work-plan.md verification section
4. **Commit** the bug fixes + feature
