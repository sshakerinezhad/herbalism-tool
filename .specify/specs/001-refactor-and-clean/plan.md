# Implementation Plan: Scorched Earth Codebase Cleanup

**Feature ID**: 001-refactor-and-clean
**Branch**: knights-of-belyar
**Created**: 2026-03-08

## Technical Context

| Aspect | Detail |
|--------|--------|
| **Framework** | Next.js 16 (App Router, `'use client'` only) |
| **Data layer** | React Query hooks in `src/lib/hooks/queries.ts` |
| **DB access** | `src/lib/db/` modules, `{ data?, error }` pattern |
| **Styling** | Tailwind CSS v4 |
| **Component pattern** | `src/components/{feature}/` with `types.ts` + barrel `index.ts` |
| **Shared types** | `src/lib/types.ts` (canonical location) |
| **Build verification** | `npm run build` after every phase |

### Dependencies
- None external. All changes are internal refactoring.
- Phase ordering: dead code (P1) → types (P2) → extractions (P3) → docs (P4)

### Known Constraints
- Steps 1.2 + 1.3 must be atomic (recipes.ts consumers live in deprecated hooks)
- `InventoryItem` type in `brew/types.ts` already exists — safe to redirect import
- `CharacterArmorData` has 3 inconsistent definitions — use widest version as canonical

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Scalability | COMPLIANT | Removing ~1,200 lines of dead code, no new abstractions |
| II. Character-Centric Data Model | COMPLIANT | Removing deprecated user-based modules, keeping character-based |
| III. React Query Data Layer | COMPLIANT | Cleaning deprecated hooks, keeping character-based hooks |
| IV. Client-Side Rendering | NOT AFFECTED | No rendering changes |
| V. Vocation-Ready Architecture | COMPLIANT | Cleanup makes shared infrastructure cleaner for future vocations |
| Build verification | COMPLIANT | `npm run build` after every phase per plan |
| Commit style | COMPLIANT | Concise messages, no AI attribution |

**Gate result**: PASS — all principles satisfied. No violations.

## Implementation Phases

### Phase 0: Git Hygiene
**Goal**: Clean working tree of accumulated meta-file changes.

| Step | Action | Verification |
|------|--------|-------------|
| 0.1 | Stage all `.claude/` changes, modified/deleted docs, deleted root files | `git status` shows clean except `src/` |
| 0.2 | Commit: `"clean up .claude tooling and stale docs"` | Commit succeeds |

### Phase 1: Dead Code Removal (~1,200 lines)
**Goal**: Delete all modules, functions, and hooks with zero live consumers.

| Step | Files Changed | Lines Removed | Dependency |
|------|--------------|--------------|------------|
| 1.1 | `HerbSelector.tsx` (fix import), DELETE `inventory.ts` | 313 | None |
| 1.2 | DELETE `recipes.ts` | 221 | Atomic with 1.3 |
| 1.3 | `queries.ts` (gut deprecated exports) | ~200 | Atomic with 1.2 |
| 1.4 | `page.tsx`, `PrefetchLink.tsx` (remove legacy prefetch) | ~40 | After 1.3 |
| 1.5 | `brewing.ts` (keep 6 exports, delete rest) | ~250 | After 1.3 |
| 1.6 | `characterInventory.ts` (delete 4 Clean functions) | ~200 | None |

**Verification**: `npm run build` passes. Grep for deleted identifiers → 0 results.
**Commit**: `"remove deprecated modules and dead code (~1,200 lines)"`

### Phase 2: Type Consolidation
**Goal**: Single canonical definition for every shared type.

| Step | Action | Detail |
|------|--------|--------|
| 2.1 | Move `CharacterArmorData` to `src/lib/types.ts` | Use widest definition (with `properties` + `notes` fields) |
| 2.2 | Update 3 consumers to import from `@/lib/types` | `queries.ts`, `edit-character/page.tsx`, `ArmorDiagram.tsx` |
| 2.3 | Audit remaining type re-exports in `queries.ts` | Remove any with zero external consumers |

**Verification**: `npm run build` passes. `grep 'type CharacterArmorData ='` → exactly 1 result.
**Commit**: `"consolidate duplicated types"`

### Phase 3: Page Extractions
**Goal**: Break monolithic pages into focused components following established patterns.

#### Step 3.1: Forage Page (713 → ~250 lines)

**New files in `src/components/forage/`:**

| File | Content | ~Lines |
|------|---------|--------|
| `types.ts` | `ForagedHerb` type | ~10 |
| `BiomeCard.tsx` | Biome selection card component | ~50 |
| `SetupPhase.tsx` | Biome allocation, session display, start button | ~170 |
| `ResultsPhase.tsx` | Results display, herb cards, add-to-inventory | ~170 |
| `index.ts` | Barrel export | ~5 |

**page.tsx retains**: auth guard, data fetching, state management, phase routing, async mutations.

**Verification**: `npm run build` passes. Manual smoke test of forage flow.
**Commit**: `"extract forage page components"`

#### Step 3.2: Create Character Wizard (1,104 → ~300 lines)

**New files in `src/components/character/wizard/`:**

| File | Content | ~Lines |
|------|---------|--------|
| `types.ts` | `WizardStep`, `WizardData`, `StepProps` | ~30 |
| `IdentitySteps.tsx` | StepName, StepRace, StepBackground, StepClass, StepOrder | ~350 |
| `BuildSteps.tsx` | StepStats, StepSkills, StepVocation | ~250 |
| `FinalSteps.tsx` | StepEquipment, StepReview | ~180 |
| `index.ts` | Barrel export | ~5 |

**page.tsx retains**: auth guard, wizard state, validation, step routing, submission.

**Verification**: `npm run build` passes. Manual smoke test of character creation.
**Commit**: `"extract create-character wizard steps"`

### Phase 4: Documentation & Final Cleanup
**Goal**: All docs reflect current codebase state.

| Step | Action |
|------|--------|
| 4.1 | Clean barrel exports (`src/lib/db/index.ts`, `src/lib/hooks/index.ts`) |
| 4.2 | Remove CLAUDE.md gotcha #7 (legacy tables — modules now deleted) |
| 4.3 | Update `docs/QUICKREF.md` — remove deleted hooks/modules |
| 4.4 | Update `docs/ARCHITECTURE.md` — remove legacy module references |
| 4.5 | Update `.claude/scratchpad.md` — reflect completed cleanup |

**Verification**: Grep for `inventory.ts`, `recipes.ts`, `useInventory`, `useBrewedItems` in docs/ → 0 results.
**Commit**: `"final cleanup and doc updates"`

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Stale import missed | `npm run build` after every step; grep for deleted module paths |
| Page extraction changes behavior | Manual smoke test of forage and character creation flows |
| Type inconsistency during consolidation | Use widest definition; build verifies all consumers compile |

## Success Metrics

1. ~1,200 lines of dead code removed
2. Every shared type has exactly 1 definition
3. Forage page: 713 → ~250 lines
4. Create character page: 1,104 → ~300 lines
5. `npm run build` passes after every phase
6. No documentation references deleted code

## Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| This plan | `.specify/specs/001-refactor-and-clean/plan.md` | Implementation guide |
| Research | `.specify/specs/001-refactor-and-clean/research.md` | Verified assumptions, decisions |
| Spec | `.specify/specs/001-refactor-and-clean/spec.md` | Requirements & success criteria |
| Masterplan | `.claude/masterplan.md` | Detailed step-by-step (superset of this plan) |
| Quickstart | `.specify/specs/001-refactor-and-clean/quickstart.md` | Implementer cheat sheet |
