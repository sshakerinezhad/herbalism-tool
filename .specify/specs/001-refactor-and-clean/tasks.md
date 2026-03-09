# Tasks: Scorched Earth Codebase Cleanup

**Feature ID**: 001-refactor-and-clean
**Generated**: 2026-03-08
**Total Tasks**: 24
**Phases**: 6

---

> **MANDATORY VERIFICATION PROTOCOL — READ THIS BEFORE TOUCHING ANY TASK**
>
> Every task below has a **Verify** field with exact test commands from `__verify__/`.
> The full mapping lives in `__verify__/task_map.json`.
>
> **The rules are non-negotiable:**
>
> 1. After implementing a task, run its **Verify** command(s).
> 2. If ANY test FAILS (non-zero exit) → the task is **FAILED**. Fix your implementation. Do NOT output TASK_COMPLETE.
> 3. If a task has a checkpoint → run it AFTER task tests pass. Checkpoint failure = entire block is broken. STOP.
> 4. You may NOT modify, skip, or weaken any test in `__verify__/`. They are **immutable acceptance criteria**.
> 5. A task is COMPLETE only when ALL its verify tests exit 0. No exceptions.
>
> If you claim TASK_COMPLETE without passing verification, you are lying. Don't.

---

## Phase 1: Setup (Git Hygiene)

**Goal**: Clean working tree so all subsequent commits are focused on code changes only.

- [x] T001 Stage and commit all accumulated `.claude/` and docs changes with message `"clean up .claude tooling and stale docs"`
  - **Verify**: Manual — Run `git status` after commit, verify .claude/ and docs changes are committed
- [x] T002 Verify clean working tree with `git status` — only `src/` changes should remain
  - **Verify**: Manual — Run `git status`, only src/ changes should remain in working tree

---

## Phase 2: Foundational — Dead Code Removal (~1,200 lines)

**Goal**: Delete all modules, functions, and hooks with zero live consumers. This MUST complete before any later phases — subsequent work depends on a clean import graph.

**Dependency**: Phase 1 complete.

### Step 2.1: Delete inventory module
- [x] T003 Fix stale import in `src/components/brew/HerbSelector.tsx` line 8: change `import { InventoryItem } from '@/lib/inventory'` → `import type { InventoryItem } from './types'`
  - **Verify**: `bash __verify__/tests/t003_herbselector_import_fixed.sh`
- [x] T004 Delete `src/lib/inventory.ts` (313 lines)
  - **Verify**: `bash __verify__/tests/t004_inventory_deleted.sh`
- [x] T005 Verify: `grep -r "@/lib/inventory" src/` returns 0 results
  - **Verify**: `bash __verify__/tests/t005_no_inventory_imports.sh`

### Step 2.2: Delete recipes module + deprecated hooks (ATOMIC)
- [x] T006 Delete `src/lib/recipes.ts` (221 lines) AND simultaneously remove all deprecated exports from `src/lib/hooks/queries.ts`: 5 fetchers, 5+ hooks, 3 invalidation helpers, deprecated query keys (~200 lines)
  - **Verify**: `bash __verify__/tests/t006_recipes_and_deprecated_hooks_deleted.sh`
- [x] T007 Verify: `npm run build` passes after atomic removal
  - **Verify**: Manual — Run `npm run build`, must exit 0

### Step 2.3: Remove legacy prefetch system
- [x] T008 Remove deprecated prefetch calls (`prefetchInventory`, `prefetchBrew`, `prefetchRecipes`) from `src/app/page.tsx`
  - **Verify**: `bash __verify__/tests/t008_legacy_prefetch_removed_page.sh`
- [x] T009 Remove legacy prefetch types and deprecated prefetch functions from `src/components/PrefetchLink.tsx` and `src/lib/hooks/queries.ts` — keep only `prefetchForage`, `prefetchProfile`, `prefetchCharacterHerbalism`
  - **Verify**: `bash __verify__/tests/t009_legacy_prefetch_removed_prefetchlink.sh`

### Step 2.4: Slim brewing module
- [x] T010 Remove deprecated functions from `src/lib/brewing.ts` (388 → ~140 lines) — retain ONLY: `PairedEffect`, `findRecipeForPair`, `canCombineEffects`, `parseTemplateVariables`, `fillTemplate`, `computeBrewedDescription`
  - **Verify**: `bash __verify__/tests/t010_brewing_slimmed.sh`

### Step 2.5: Remove dead DB functions
- [x] T011 Delete 4 unused "Clean" functions from `src/lib/db/characterInventory.ts`: `fetchCharacterWeaponsClean` (line 382), `addCharacterWeaponClean` (line 441), `fetchCharacterItemsClean` (line 492), `addCharacterItemClean` (line 537) (~200 lines)
  - **Verify**: `bash __verify__/tests/t011_dead_clean_functions_removed.sh`

### Phase 2 Verification
- [x] T012 Run `npm run build` — must pass. Grep for all deleted identifiers (`inventory.ts`, `recipes.ts`, `useInventory`, `useBrewedItems`, `prefetchInventory`, `prefetchBrew`, `prefetchRecipes`, `fetchCharacterWeaponsClean`) → 0 results each
  - **Checkpoint**: `bash __verify__/checkpoint_1_dead_code.sh` — MUST pass before proceeding to next phase
- [x] T013 Commit: `"remove deprecated modules and dead code (~1,200 lines)"`
  - **Verify**: Manual — Create commit with message: `remove deprecated modules and dead code (~1,200 lines)`

---

## Phase 3: US1 — Type Consolidation

**Goal**: Every shared type has exactly one canonical definition.
**Dependency**: Phase 2 complete.
**Maps to**: Spec Scenario 4 (FR-2)

- [x] T014 [US1] Move `CharacterArmorData` to `src/lib/types.ts` using the widest definition (with `properties` + `notes` fields)
  - **Verify**: `bash __verify__/tests/t014_armor_type_in_types_ts.sh`
- [x] T015 [US1] Update 3 consumers to import from `@/lib/types`: `src/lib/hooks/queries.ts`, `src/app/edit-character/page.tsx`, `src/components/ArmorDiagram.tsx`
  - **Verify**: `bash __verify__/tests/t015_armor_consumers_updated.sh`
- [x] T016 [US1] Audit remaining type re-exports in `src/lib/hooks/queries.ts` — remove any with zero external consumers
  - **Verify**: Manual — For each type re-export at bottom of queries.ts, grep consumers in src/. Remove any with zero external imports.
- [x] T017 [US1] Verify: `npm run build` passes. `grep -r "type CharacterArmorData =" src/` returns exactly 1 result. Commit: `"consolidate duplicated types"`
  - **Checkpoint**: `bash __verify__/checkpoint_2_types.sh` — MUST pass before proceeding to next phase

---

## Phase 4: US2 — Forage Page Extraction (713 → ~250 lines)

**Goal**: Break forage page into focused components following established extraction pattern.
**Dependency**: Phase 3 complete.
**Maps to**: Spec Scenario 2 (FR-3.1)
**Note**: Parallelizable with Phase 5 (US3) — different files, no shared dependencies.

- [x] T018 [P] [US2] Create `src/components/forage/types.ts` with `ForagedHerb` type (~10 lines)
  - **Verify**: `bash __verify__/tests/t018_forage_types.sh`
- [x] T019 [P] [US2] Extract `src/components/forage/BiomeCard.tsx` — biome selection card component (~50 lines)
  - **Verify**: `bash __verify__/tests/t019_forage_biomecard.sh`
- [x] T020 [P] [US2] Extract `src/components/forage/SetupPhase.tsx` — biome allocation, session display, start button (~170 lines)
  - **Verify**: `bash __verify__/tests/t020_forage_setupphase.sh`
- [x] T021 [P] [US2] Extract `src/components/forage/ResultsPhase.tsx` — results display, herb cards, add-to-inventory (~170 lines)
  - **Verify**: `bash __verify__/tests/t021_forage_resultsphase.sh`
- [x] T022 [US2] Create barrel export `src/components/forage/index.ts`, update `src/app/forage/page.tsx` to import from new components, verify page retains: auth guard, data fetching, state management, phase routing, async mutations
  - **Verify**: `bash __verify__/tests/t022_forage_barrel_and_page.sh`
- [x] T023 [US2] Verify: `npm run build` passes. Manual smoke test of forage flow (setup → roll → results → add to inventory). Commit: `"extract forage page components"`
  - **Checkpoint**: `bash __verify__/checkpoint_3_forage.sh` — MUST pass before proceeding to next phase
  - **Verify**: Manual — Smoke test forage flow: setup → roll → results → add to inventory

---

## Phase 5: US3 — Create Character Wizard Extraction (1,104 → ~300 lines)

**Goal**: Break wizard into themed step component files.
**Dependency**: Phase 3 complete.
**Maps to**: Spec Scenario 3 (FR-3.2)
**Note**: Parallelizable with Phase 4 (US2) — different files, no shared dependencies.

- [ ] T024 [P] [US3] Create `src/components/character/wizard/types.ts` with `WizardStep`, `WizardData`, `StepProps` types (~30 lines)
  - **Verify**: `bash __verify__/tests/t024_wizard_types.sh`
- [ ] T025 [P] [US3] Extract `src/components/character/wizard/IdentitySteps.tsx` — StepName, StepRace, StepBackground, StepClass, StepOrder (~350 lines)
  - **Verify**: `bash __verify__/tests/t025_wizard_identitysteps.sh`
- [ ] T026 [P] [US3] Extract `src/components/character/wizard/BuildSteps.tsx` — StepStats, StepSkills, StepVocation (~250 lines)
  - **Verify**: `bash __verify__/tests/t026_wizard_buildsteps.sh`
- [ ] T027 [P] [US3] Extract `src/components/character/wizard/FinalSteps.tsx` — StepEquipment, StepReview (~180 lines)
  - **Verify**: `bash __verify__/tests/t027_wizard_finalsteps.sh`
- [ ] T028 [US3] Create barrel export `src/components/character/wizard/index.ts`, update `src/app/create-character/page.tsx` to import from new components, verify page retains: auth guard, wizard state, validation, step routing, submission
  - **Verify**: `bash __verify__/tests/t028_wizard_barrel_and_page.sh`
- [ ] T029 [US3] Verify: `npm run build` passes. Manual smoke test of character creation flow (all 10 steps → submit). Commit: `"extract create-character wizard steps"`
  - **Checkpoint**: `bash __verify__/checkpoint_4_wizard.sh` — MUST pass before proceeding to next phase
  - **Verify**: Manual — Smoke test character creation: all 10 wizard steps → submit

---

## Phase 6: Polish — Documentation & Final Cleanup

**Goal**: All documentation reflects the current codebase state. No references to deleted code.
**Dependency**: Phases 4 and 5 complete.
**Maps to**: Spec Scenario 5 (FR-4)

- [ ] T030 Clean barrel exports in `src/lib/db/index.ts` and `src/lib/hooks/index.ts` — remove re-exports of deleted modules
  - **Verify**: `bash __verify__/tests/t030_barrel_exports_cleaned.sh`
- [ ] T031 Remove CLAUDE.md gotcha #7 ("Legacy tables deprecated" — modules now deleted)
  - **Verify**: `bash __verify__/tests/t031_claude_gotcha7_removed.sh`
- [ ] T032 Update `docs/QUICKREF.md` — remove references to deleted hooks (`useInventory`, `useBrewedItems`, etc.) and modules (`inventory.ts`, `recipes.ts`)
  - **Verify**: `bash __verify__/tests/t032_quickref_cleaned.sh`
- [ ] T033 Update `docs/ARCHITECTURE.md` — remove legacy module references
  - **Verify**: `bash __verify__/tests/t033_architecture_cleaned.sh`
- [ ] T034 Update `.claude/scratchpad.md` — reflect completed cleanup with current line counts
  - **Verify**: Manual — Verify scratchpad.md reflects completed cleanup with current line counts
- [ ] T035 Verify: grep for `inventory.ts`, `recipes.ts`, `useInventory`, `useBrewedItems` in `docs/` and `CLAUDE.md` → 0 results. Commit: `"final cleanup and doc updates"`
  - **Verify**: `bash __verify__/tests/t035_no_deleted_refs_in_docs.sh`
  - **Checkpoint**: `bash __verify__/checkpoint_5_final.sh` — MUST pass before marking feature complete

---

## Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Dead Code Removal) [BLOCKING]
        └─→ Phase 3 (Type Consolidation)
              ├─→ Phase 4 (Forage Extraction) ──┐
              └─→ Phase 5 (Wizard Extraction) ──┤ [PARALLEL]
                                                 └─→ Phase 6 (Docs & Cleanup)
```

## Parallel Execution Opportunities

| Tasks | Why Parallelizable |
|-------|-------------------|
| T018, T019, T020, T021 | Different new files in `src/components/forage/`, no interdependence |
| T024, T025, T026, T027 | Different new files in `src/components/character/wizard/`, no interdependence |
| Phase 4 & Phase 5 entirely | Forage and wizard extractions touch completely different files |

## Implementation Strategy

**MVP Scope**: Phases 1-2 (Setup + Dead Code Removal) — delivers the highest-value change (~1,200 lines removed) with lowest risk. Build verification confirms no regressions.

**Incremental Delivery**:
1. Phases 1-2: Dead code gone, build clean → commit
2. Phase 3: Types consolidated → commit
3. Phases 4+5: Pages extracted (can be parallel) → 2 commits
4. Phase 6: Docs updated → commit

**Total commits**: 5-6 focused commits, each independently valid.

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 35 |
| Setup tasks | 2 |
| Foundational tasks | 11 |
| US1 (Type Consolidation) tasks | 4 |
| US2 (Forage Extraction) tasks | 6 |
| US3 (Wizard Extraction) tasks | 6 |
| Polish tasks | 6 |
| Parallel opportunities | 3 (forage files, wizard files, Phase 4 ∥ Phase 5) |
| Estimated lines removed | ~1,200 |
| Estimated lines moved | ~1,400 (page → components) |
| Build checkpoints | 5 (`npm run build` after each phase) |
