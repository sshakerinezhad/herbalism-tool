# Scorched Earth Cleanup Plan

## Context

Coming back to an older repo after a break. The codebase is well-architected (8.5/10) — good patterns, accurate docs, successful Phase 1-2 refactoring. But it has accumulated cruft: deprecated modules still present, type safety holes, 3 monolith pages, 30+ dirty git files, and stale meta-files. Goal: simplest, most effective, bulletproof codebase ready for active development. Guiding principle from CLAUDE.md: **simple code is king**.

## Approach

Bottom-up by layer (data → hooks → components → pages). Each phase is independently valuable and unblocks the next. Every step gets a `npm run build` verification. Page extractions follow the proven inventory/brew extraction pattern.

---

## Phase 0: Git Hygiene

**Step 0.1 — Commit meta-file changes**
- Stage all `.claude/` changes (deletions + new files + modifications)
- Stage modified/deleted docs (README, ARCHITECTURE, CONTRIBUTING, QUICKREF, SUPABASE-CLI, DATABASE, PLANNING-KNIGHTS, cleanup.md)
- Stage deleted root files (CHANGELOG.md, lesswrong_post)
- Commit separately from code changes: `"clean up .claude tooling and stale docs"`
- **Verify:** `git status` shows clean working tree except src/

---

## Phase 1: Delete Dead Code (~1,200 lines removed)

All dead code confirmed via import tracing. Zero live consumers for anything being deleted.

### Step 1.1 — Fix one stale import, delete `src/lib/inventory.ts`
- `src/components/brew/HerbSelector.tsx` line 8: change `import { InventoryItem } from '@/lib/inventory'` → `import type { InventoryItem } from './types'` (type already exists at `brew/types.ts:11`)
- Delete `src/lib/inventory.ts` (313 lines)
- **Verify:** `npm run build` passes. Grep `@/lib/inventory` → zero results.

### Step 1.2 — Delete `src/lib/recipes.ts`
- Delete entire file (221 lines). All exports consumed only by deprecated hooks removed in Step 1.3.
- Must happen atomically with Step 1.3.

### Step 1.3 — Gut deprecated code from `src/lib/hooks/queries.ts`
Remove from `queries.ts` (~200 lines):
- Imports from `../inventory`, `../brewing`, `../recipes` (lines 20-22)
- Deprecated query keys: `inventory`, `brewedItems`, `userRecipes`, `recipeStats`
- Deprecated fetchers (5 functions, lines ~83-116)
- Deprecated hooks: `useInventory`, `useBrewedItems`, `useUserRecipesForBrewing`, `useUserRecipes`, `useRecipeStats`
- Deprecated invalidation helpers: `invalidateInventory`, `invalidateBrewedItems`, `invalidateRecipes`
- Legacy keys from `invalidateAllUserData`
- Deprecated prefetch functions: `prefetchInventory`, `prefetchBrew`, `prefetchRecipes`
- Type re-exports: `InventoryItem`, `UserRecipe`

### Step 1.4 — Update prefetch consumers
The prefetch calls in `page.tsx` and `PrefetchLink.tsx` referenced now-deleted functions. These were filling legacy caches that no page reads from (pages use character-based hooks with different query keys).

- `src/app/page.tsx`: Replace legacy prefetch calls with `prefetchCharacterHerbalism(characterId)` (already exists in queries.ts)
- `src/components/PrefetchLink.tsx`: Remove `'inventory' | 'brew' | 'recipes'` prefetch types and their switch cases. Remove `profileId` prop. Keep only `'forage' | 'profile' | 'none'`. Update all call sites to remove `profileId` prop and legacy prefetch types.

**[DECISION] Simplify PrefetchLink rather than plumb `characterId` through.**
Why: The hover-prefetch for inventory/brew/recipes was filling the wrong cache anyway — removing it is net zero behavior change. Home page prefetch on load handles the character-based prefetch.

- **Verify:** `npm run build` passes. Grep for `prefetchInventory`, `prefetchBrew`, `prefetchRecipes` → zero results.

### Step 1.5 — Slim down `src/lib/brewing.ts` (388 → ~140 lines)
**Keep** (actively imported by 4+ files): `PairedEffect` type, `findRecipeForPair`, `canCombineEffects`, `parseTemplateVariables`, `fillTemplate`, `computeBrewedDescription`

**Delete:** `ElementPool`, `BrewingResult` types, `buildElementPool`, `getTotalElements`, `fetchRecipes`, `fetchUserRecipes`, `saveBrewedItem`, `getBrewedItems`, `removeBrewedItem`. Also remove `supabase` import (no longer needed).

- **Verify:** `npm run build` passes. File has exactly 6 exports (5 functions + 1 type).

### Step 1.6 — Remove dead functions from `src/lib/db/characterInventory.ts` (~200 lines)
Delete 4 unused "Clean" functions (zero consumers confirmed): `fetchCharacterWeaponsClean`, `addCharacterWeaponClean`, `fetchCharacterItemsClean`, `addCharacterItemClean`

- **Verify:** `npm run build` passes. Grep `Clean(` in src/ → zero results.

### Phase 1 Summary
| File | Before | After |
|------|--------|-------|
| `inventory.ts` | 313 | DELETED |
| `recipes.ts` | 221 | DELETED |
| `brewing.ts` | 388 | ~140 |
| `hooks/queries.ts` | 753 | ~550 |
| `db/characterInventory.ts` | 579 | ~375 |
| `PrefetchLink.tsx` | 107 | ~70 |

---

## Phase 2: Type Consolidation

### Step 2.1 — Consolidate `CharacterArmorData` (defined in 3 places)
Currently duplicated in: `queries.ts` (line 742), `edit-character/page.tsx` (line 37), `ArmorDiagram.tsx` (line 9).

- Move canonical definition to `src/lib/types.ts` (where all shared types live — existing pattern)
- Update all 3 files to import from `@/lib/types`
- **Verify:** `npm run build` passes. Grep `type CharacterArmorData =` → exactly 1 result.

### Step 2.2 — Audit type re-exports in queries.ts
Check if remaining type re-exports at bottom of queries.ts are actually imported by consumers from `@/lib/hooks`. Remove any with zero external consumers.
- **Verify:** `npm run build` passes.

---

## Phase 3: Page Extractions

### Step 3.1 — Extract Forage Components (713 → ~250 lines)
Simplest extraction — clean two-phase structure maps directly to components.

Create `src/components/forage/`:
- `types.ts` — `ForagedHerb` type
- `BiomeCard.tsx` (~50 lines) — biome selection card
- `SetupPhase.tsx` (~170 lines) — biome allocation, session display, start button
- `ResultsPhase.tsx` (~170 lines) — results, herb cards, add-to-inventory
- `index.ts` — barrel export

`page.tsx` keeps: auth guard, data fetching, state management, phase routing, async mutations.

- **Verify:** `npm run build` passes. Manual test: forage flow end-to-end.

### Step 3.2 — Extract Create Character Steps (1,104 → ~300 lines)
10 wizard step functions (starting line 497) are already cleanly separated with `StepProps` interface.

**[DECISION] Group into 3 themed files, not 10 individual files.**
Why: Each step is 30-80 lines. Individual files for 30-line functions is unnecessary fragmentation. CLAUDE.md: "Don't create helpers for one-time operations."

Create `src/components/character/wizard/`:
- `types.ts` — `WizardStep`, `WizardData`, `StepProps`
- `IdentitySteps.tsx` (~350 lines) — StepName, StepRace, StepBackground, StepClass, StepOrder
- `BuildSteps.tsx` (~250 lines) — StepStats, StepSkills, StepVocation
- `FinalSteps.tsx` (~180 lines) — StepEquipment, StepReview
- `index.ts` — barrel export

`page.tsx` keeps: auth guard, wizard state, validation, step routing, submission.

- **Verify:** `npm run build` passes. Manual test: create character wizard end-to-end.

---

## Phase 4: Final Cleanup

### Step 4.1 — Clean barrel exports
- Check `src/lib/db/index.ts` — if unused (pages import directly from `@/lib/db/characters`), delete it
- Update `src/lib/hooks/index.ts` comment (still references deleted hooks)

### Step 4.2 — Update documentation
- `CLAUDE.md` gotcha #7: Remove "Legacy tables deprecated" note (modules are now deleted)
- `.claude/scratchpad.md`: Rewrite to reflect completed cleanup, updated line counts, what's left
- `docs/QUICKREF.md`: Remove references to deleted hooks/modules
- `docs/ARCHITECTURE.md`: Remove legacy module references

- **Verify:** Grep for `inventory.ts`, `recipes.ts`, `useInventory`, `useBrewedItems` in docs/ → zero results.

---

## Explicitly Skipped (and why)

| Item | Why Skipped |
|------|-------------|
| **Edit character extraction** (636 lines) | Manageable size. Sections share form state — extraction creates messy prop boundaries. Negative ROI. |
| **Shared form components** (scratchpad Batch 3) | Speculative reuse. Create and Edit character UIs diverge enough that sharing requires prop gymnastics. YAGNI. |
| **`as unknown as` type casts** (5 active in characters.ts/biomes.ts) | Structurally safe at runtime. The bug-causing cast was in now-deleted code. Fixing requires Supabase join type investigation — separate concern. |
| **Performance optimizations** (scratchpad Phase 4) | Premature optimization. No evidence of actual perf issues. |
| **SSR migration** | All pages are `'use client'`. Would require architectural rethink. Not a cleanup task. |

---

## Commit Strategy

1. `clean up .claude tooling and stale docs` — Phase 0
2. `remove deprecated modules and dead code (~1,200 lines)` — Phase 1
3. `consolidate duplicated types` — Phase 2
4. `extract forage page components` — Phase 3.1
5. `extract create-character wizard steps` — Phase 3.2
6. `final cleanup and doc updates` — Phase 4

Each commit: `npm run build` must pass. Commits 4-5: manual smoke test of affected pages.

---

## Critical Files

| File | Role in Plan |
|------|-------------|
| `src/lib/hooks/queries.ts` | Heaviest change — remove ~200 lines of deprecated hooks, fetchers, prefetches |
| `src/lib/brewing.ts` | Gut from 388 to ~140 lines, keep only 6 active exports |
| `src/lib/inventory.ts` | DELETE entirely |
| `src/lib/recipes.ts` | DELETE entirely |
| `src/lib/db/characterInventory.ts` | Remove ~200 lines of dead "Clean" functions |
| `src/components/PrefetchLink.tsx` | Simplify — remove legacy prefetch types |
| `src/app/page.tsx` | Update prefetch calls |
| `src/app/forage/page.tsx` | Extract to components |
| `src/app/create-character/page.tsx` | Extract wizard steps |
| `src/components/brew/HerbSelector.tsx` | Fix one stale import |
