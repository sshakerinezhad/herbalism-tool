# Feature Specification: Scorched Earth Codebase Cleanup

**Feature ID**: 001-refactor-and-clean
**Status**: Draft
**Created**: 2026-03-08
**Last Updated**: 2026-03-08

## Overview

The codebase has accumulated technical debt through two completed migration phases: deprecated modules that are no longer consumed, duplicated type definitions, monolithic page files exceeding 700+ lines, and documentation referencing deleted functionality. This cleanup removes all dead code, consolidates types to single sources of truth, extracts large pages into focused components, and brings documentation in sync with reality.

**Why now**: The codebase is well-architected (successful Phase 1-2 refactoring) but carrying ~1,200 lines of unreachable code, 3 oversized page files, and stale docs. This cruft increases onboarding confusion, slows navigation, and creates false positive search results. Cleaning it before active feature development prevents compounding debt.

## Goals

1. **Remove all dead code** — eliminate modules, functions, hooks, and prefetch helpers that have zero live consumers
2. **Consolidate duplicated types** — ensure each shared type has exactly one canonical definition
3. **Extract monolithic pages** — break large page files into focused, reusable components following established extraction patterns
4. **Synchronize documentation** — update all docs to reflect the current state of the codebase

## Non-Goals

- Changing any user-facing behavior or UI
- Performance optimization (no evidence of actual issues)
- Server-side rendering migration (architectural change, not cleanup)
- Extracting edit-character page (manageable size, sections share form state — extraction has negative ROI)
- Creating shared form components between create/edit character (speculative reuse, UIs diverge enough)
- Fixing `as unknown as Type` casts (structurally safe at runtime, separate concern requiring Supabase join type investigation)

## User Scenarios & Testing

### Scenario 1: Developer removes deprecated modules

**Given** the codebase contains deprecated inventory, recipe, and brewing modules with zero live consumers
**When** a developer deletes these modules and their associated hooks/prefetches
**Then** the application builds successfully with no broken imports, and all existing pages function identically

### Scenario 2: Developer extracts forage page components

**Given** the forage page is a single 713-line file with two distinct phases (setup and results)
**When** a developer extracts each phase into its own component
**Then** the page file reduces to ~250 lines of auth/state/routing logic, the build passes, and the forage flow works end-to-end identically

### Scenario 3: Developer extracts create-character wizard steps

**Given** the create-character page is 1,104 lines containing 10 wizard step functions
**When** a developer groups steps into themed component files (identity, build, final)
**Then** the page file reduces to ~300 lines of wizard state/validation/routing logic, the build passes, and character creation works end-to-end identically

### Scenario 4: Developer searches for a type definition

**Given** `CharacterArmorData` is currently defined in 3 separate files
**When** a developer consolidates it to a single canonical location
**Then** searching for the type definition returns exactly 1 result, and all consumers import from the same source

### Scenario 5: Developer reads project documentation

**Given** documentation references deprecated hooks, modules, and legacy tables
**When** a developer updates all docs to reflect current state
**Then** no documentation references deleted code or removed functionality

## Functional Requirements

### FR-1: Dead Code Removal

- **FR-1.1**: Delete the deprecated inventory module (`src/lib/inventory.ts`, ~313 lines) after fixing the single stale import that references it
- **FR-1.2**: Delete the deprecated recipes module (`src/lib/recipes.ts`, ~221 lines)
- **FR-1.3**: Remove all deprecated exports from the hooks module: 5 fetchers, 5+ hooks, 3 invalidation helpers, 3 prefetch functions, and associated query keys (~200 lines)
- **FR-1.4**: Remove deprecated prefetch call sites from the home page and simplify the prefetch link component by removing legacy prefetch types
- **FR-1.5**: Remove deprecated functions from the brewing utility module, retaining only the 6 actively consumed exports (~250 lines removed)
- **FR-1.6**: Remove 4 unused "Clean" variant functions from the character inventory database module (~200 lines)

### FR-2: Type Consolidation

- **FR-2.1**: Move `CharacterArmorData` to a single canonical location and update all 3 consuming files to import from there
- **FR-2.2**: Audit and remove any type re-exports from the hooks module that have zero external consumers

### FR-3: Page Component Extraction

- **FR-3.1**: Extract the forage page into focused components following the established extraction pattern: types file, phase-specific components (setup, results), biome card component, and barrel export
- **FR-3.2**: Extract the create-character wizard steps into themed component groups: identity steps (name, race, background, class, order), build steps (stats, skills, vocation), and final steps (equipment, review)

### FR-4: Documentation Synchronization

- **FR-4.1**: Remove the "Legacy tables deprecated" gotcha from project instructions (the deprecated modules no longer exist)
- **FR-4.2**: Remove references to deleted hooks and modules from the quick reference guide
- **FR-4.3**: Remove legacy module references from the architecture documentation
- **FR-4.4**: Update the scratchpad to reflect completed cleanup with current line counts

## Success Criteria

1. **Zero dead code**: No module, function, hook, or type exists without at least one live consumer — confirmed by import tracing
2. **Single source of truth for types**: Every shared type has exactly one definition — searching for any type definition returns exactly 1 result
3. **Page file sizes reduced**: Forage page drops from ~713 to ~250 lines; create-character page drops from ~1,104 to ~300 lines
4. **No behavior changes**: All user-facing functionality remains identical — build passes and manual smoke tests confirm forage and character creation flows
5. **Documentation accuracy**: No documentation file references deleted code, removed hooks, or deprecated modules — verified by text search
6. **Build integrity**: `npm run build` passes after every phase of changes

## Key Entities

| Entity | Description |
|--------|-------------|
| Deprecated modules | `inventory.ts`, `recipes.ts` — legacy data access layers superseded by character-based hooks |
| Deprecated hooks | `useInventory`, `useBrewedItems`, `useUserRecipesForBrewing`, `useUserRecipes`, `useRecipeStats` — tied to deprecated `user_*` tables |
| Deprecated prefetches | `prefetchInventory`, `prefetchBrew`, `prefetchRecipes` — filled wrong cache keys (user-based, not character-based) |
| Duplicated type | `CharacterArmorData` — defined in 3 files, needs single canonical source |
| Monolith pages | Forage (713 lines), Create Character (1,104 lines) — extraction candidates |
| Retained brewing exports | `PairedEffect`, `findRecipeForPair`, `canCombineEffects`, `parseTemplateVariables`, `fillTemplate`, `computeBrewedDescription` |

## Assumptions

1. Line counts referenced in the masterplan are current and accurate (will be verified during implementation)
2. The "proven inventory/brew extraction pattern" (barrel exports, types file, focused components) is the correct pattern to follow for new extractions
3. Import tracing confirming zero consumers for dead code has already been performed and is accurate
4. The single stale import in `HerbSelector.tsx` referencing `@/lib/inventory` is the only import that needs fixing before deletion
5. Grouping wizard steps into 3 themed files (rather than 10 individual files) is the right granularity per CLAUDE.md's "don't create helpers for one-time operations" principle

## Dependencies

- No external dependencies — all changes are internal refactoring
- Phase ordering matters: dead code removal (Phase 1) before type consolidation (Phase 2) before page extractions (Phase 3) before documentation (Phase 4)
- Steps 1.2 and 1.3 must happen atomically (recipes.ts consumers are in the deprecated hooks being removed)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale import missed during dead code removal | Build failure | `npm run build` verification after each step; grep for deleted module paths |
| Page extraction changes behavior subtly | User-facing regression | Manual smoke test of forage and character creation flows after extraction |
| Masterplan line counts are outdated | Plan steps need adjustment | Verify actual file sizes before each extraction phase |

## Scope Boundary

**In scope**: Everything described in Phases 0-4 of the masterplan — git hygiene, dead code removal, type consolidation, forage/create-character extraction, documentation updates.

**Explicitly out of scope** (with rationale from masterplan):
- Edit character extraction — manageable size, shared form state makes extraction messy
- Shared form components — speculative reuse, create/edit UIs diverge enough
- `as unknown as Type` casts — structurally safe, separate Supabase concern
- Performance optimizations — premature, no evidence of actual issues
- SSR migration — architectural change, not cleanup
