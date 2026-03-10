# Scorched Earth Cleanup Plan — COMPLETE

**Branch:** `knights-of-belyar` | **Spec:** `001-refactor-and-clean` | **Status:** All phases done
**Result:** ~1,200 lines dead code removed, ~1,400 lines extracted into focused components, 1 post-cleanup bug fixed

## Context

Coming back to an older repo after a break. The codebase was well-architected (8.5/10) — good patterns, accurate docs, successful Phase 1-2 refactoring. But it had accumulated cruft: deprecated modules still present, type safety holes, 3 monolith pages, 30+ dirty git files, and stale meta-files. Goal: simplest, most effective, bulletproof codebase ready for active development. Guiding principle from CLAUDE.md: **simple code is king**.

## Approach

Bottom-up by layer (data → hooks → components → pages). Each phase independently valuable and unblocks the next. Every step verified with `npm run build`. Page extractions followed the proven inventory/brew extraction pattern.

---

## Phase 0: Git Hygiene ✅

**Step 0.1 — Commit meta-file changes** ✅
- Staged and committed all `.claude/` changes, stale docs, deleted root files

---

## Phase 1: Delete Dead Code (~1,200 lines removed) ✅

### Step 1.1 — Fix stale import, delete `src/lib/inventory.ts` ✅
### Step 1.2 — Delete `src/lib/recipes.ts` ✅
### Step 1.3 — Gut deprecated code from `src/lib/hooks/queries.ts` ✅
### Step 1.4 — Update prefetch consumers ✅

**[DECISION] Simplified PrefetchLink rather than plumb `characterId` through.**
Why: The hover-prefetch for inventory/brew/recipes was filling the wrong cache anyway — removing it was net zero behavior change.

### Step 1.5 — Slim down `src/lib/brewing.ts` (388 → 152 lines) ✅
### Step 1.6 — Remove dead functions from `src/lib/db/characterInventory.ts` (579 → 371 lines) ✅

### Phase 1 Actual Results
| File | Before | After | Change |
|------|--------|-------|--------|
| `src/lib/inventory.ts` | 313 | DELETED | -313 |
| `src/lib/recipes.ts` | 221 | DELETED | -221 |
| `src/lib/brewing.ts` | 388 | 152 | -236 |
| `src/lib/hooks/queries.ts` | 753 | 547 | -206 |
| `src/lib/db/characterInventory.ts` | 579 | 371 | -208 |

---

## Phase 2: Type Consolidation ✅

### Step 2.1 — Consolidate `CharacterArmorData` ✅
- Canonical definition in `src/lib/types.ts`, 3 consumers updated to import from there

### Step 2.2 — Audit type re-exports ✅
- Removed 17 unused type re-exports from queries.ts

---

## Phase 3: Page Extractions ✅

### Step 3.1 — Extract Forage Components (713 → 363 lines) ✅

Created `src/components/forage/`:
- `types.ts` — `ForagedHerb` type
- `BiomeCard.tsx` — biome selection card
- `SetupPhase.tsx` — biome allocation, session display, start button
- `ResultsPhase.tsx` — results, herb cards, add-to-inventory
- `index.ts` — barrel export

### Step 3.2 — Extract Create Character Steps (1,104 → 446 lines) ✅

**[DECISION] Grouped into 3 themed files, not 10 individual files.**
Why: Each step is 30-80 lines. Individual files for 30-line functions is unnecessary fragmentation.

Created `src/components/character/wizard/`:
- `types.ts` — `WizardStep`, `WizardData`, `StepProps`
- `IdentitySteps.tsx` — StepName, StepRace, StepBackground, StepClass, StepOrder
- `BuildSteps.tsx` — StepStats, StepSkills, StepVocation
- `FinalSteps.tsx` — StepEquipment, StepReview
- `index.ts` — barrel export

---

## Phase 4: Final Cleanup ✅

### Step 4.1 — Clean barrel exports ✅
### Step 4.2 — Update documentation ✅

---

## Phase 5: Post-Cleanup Bug Fixes ✅

### Step 5.1 — Fix duplicate React keys in SelectedHerbsSummary ✅

- `src/lib/hooks/useBrewState.ts:116`: Removed redundant `for` loop that pushed the same `InventoryItem` N times into `selectedHerbs` array
- **Root cause:** When qty > 1, the array contained `[item{id:4}, item{id:4}]`. `SelectedHerbsSummary` mapped with `key={item.id}`, giving React two children with the same key.
- **Why it was safe:** Quantity tracking was already handled by `selectedHerbQuantities` Map — the duplication was unnecessary. No downstream code depended on array length.
- **Gotcha added to CLAUDE.md** (#7): React keys on mapped arrays — never use `item.id` as key if same item can appear multiple times.

---

## Explicitly Skipped (and why)

| Item | Why Skipped |
|------|-------------|
| **Edit character extraction** (636 lines) | Manageable size. Sections share form state — extraction creates messy prop boundaries. Negative ROI. |
| **Shared form components** | Speculative reuse. Create and Edit character UIs diverge enough that sharing requires prop gymnastics. YAGNI. |
| **`as unknown as` type casts** (5 active) | Structurally safe at runtime. Fixing requires Supabase join type investigation — separate concern. |
| **Performance optimizations** | Premature. No evidence of actual perf issues. |
| **SSR migration** | All pages are `'use client'`. Would require architectural rethink. Not a cleanup task. |

---

## Established Patterns (for future work)

- **Extraction model:** `src/components/<feature>/` with `types.ts`, barrel `index.ts`
- **Hook model:** `src/lib/hooks/use<Feature>State.ts` for complex state
- **page.tsx role after extraction:** auth guards, data fetching, async mutations, orchestration/render

---

## Commit History

1. `clean up .claude tooling and stale docs` — Phase 0
2. `remove deprecated modules and dead code (~1,200 lines)` — Phase 1
3. `consolidate duplicated types` — Phase 2
4. `extract forage page components` — Phase 3.1
5. `extract create-character wizard steps` — Phase 3.2
6. `final cleanup and doc updates` — Phase 4
7. (pending) Post-cleanup bug fix + doc updates — Phase 5
