# Cleanup + Refactor Plan (Expanded)

## Overall Progress
- ✅ **Phase 1: Stabilize User-Facing Behavior** - COMPLETED
- ✅ **Phase 2: Data Layer Consolidation** - COMPLETED (2026-01-01)
- ⏳ Phase 3: Refactor Monolith Pages - NOT STARTED
- ⏳ Phase 4: Performance & Scalability - NOT STARTED
- ⏳ Phase 5: Validation & QA - NOT STARTED

## Goals
- Reduce bloat in large pages and make the codebase easier to maintain.
- Improve reliability (atomic inventory changes, consistent error UX).
- Improve scalability and performance (lazy loading, reduced client footprint).

## Decision Criteria (used to order work)
1) User impact and correctness (bugs / data loss risk)
2) Risk reduction (stability of core flows)
3) Leverage (enables multiple future changes)
4) Cost (low effort, high payoff first)

## Context Sources (files reviewed)
- src/app/inventory/page.tsx (very large: ~2205 lines, mixed UI + data + mutations)
- src/app/brew/page.tsx, src/app/forage/page.tsx, src/app/create-character/page.tsx, src/app/edit-character/page.tsx
- src/lib/hooks/queries.ts (React Query usage)
- src/lib/db/characters.ts, src/lib/db/characterInventory.ts
- src/lib/profile.tsx (profile + localStorage)
- src/components/character/*, src/components/ui/* (large components)

## Key Motivations (why these steps)
- Data integrity risk: inventory/brew/forage mutations are multi-step and not atomic.
- UX gaps: missing error surfacing for some fetches; login redirect flicker.
- Inconsistent data layer: mix of React Query hooks and manual fetches.
- Large client-only pages: all main routes are 'use client', limiting SSR and increasing payload.
- Direct Supabase calls embedded in UI make testing and future changes harder.

## Phase 0: Align Scope (prep)
- Confirm critical user flows to prioritize: auth/login, inventory management, forage, brew, create/edit character.
- Define "done" for this pass: smaller modules, consistent data layer, no silent failures, stable inventory mutations.
- Rationale: ensures refactor stays focused on user-impact areas and avoids endless cleanup.

## Phase 1: Stabilize User-Facing Behavior ✅ COMPLETED

1) ~~Auth gating flicker~~ - DEPRIORITIZED
   - Skeleton approach is working fine; no visible flicker issues.

2) Error visibility ✅ COMPLETED
   - Created `src/components/ui/WarningDisplay.tsx` for dismissible warnings
   - Updated `src/app/create-character/page.tsx` to show warnings for failed secondary saves
   - Updated `src/app/profile/page.tsx` to surface armor mutation errors

3) Atomic inventory mutations ✅ COMPLETED
   - Created `supabase/migrations/009_atomic_inventory_functions.sql` with 4 RPC functions:
     - `add_character_herbs` - atomic upsert with ownership check
     - `remove_character_herbs` - row locking with validation
     - `consume_character_brewed_item` - row locking with validation
     - `brew_items` - atomic multi-step transaction for brewing
   - Updated `src/lib/db/characterInventory.ts` to use RPC calls
   - Updated `src/app/brew/page.tsx` to use atomic `brewItems()` function
   - Migration deployed to Supabase, types regenerated

4) Small cleanup ✅ COMPLETED
   - Updated `src/app/inventory/page.tsx` to use separate search state per tab (WeaponsTab, ItemsTab)

## Phase 2: Data Layer Consolidation ✅ COMPLETED (2026-01-01)

**Summary of completed work:**
1) ✅ Moved Supabase calls out of UI pages into db layer
   - `forage/page.tsx` → uses `fetchBiomeHerbs()` from `db/biomes.ts`
   - `inventory/page.tsx` → uses `deleteCharacterWeapon()`, `consumeCharacterItem()`, `deleteCharacterItem()` from `db/characters.ts`
   - `edit-character/page.tsx` → uses `updateCharacter()` from `db/characters.ts`
   - `recipes/page.tsx` → fully migrated to character-based hooks

2) ✅ Added atomic RPC for item consumption
   - `supabase/migrations/010_atomic_item_functions.sql` with `consume_character_item` RPC
   - Full safeguards: auth.uid(), SET search_path, quantity validation, row locking

3) ✅ Migrated React Query hooks from legacy user-based to character-based
   - Added `useCharacterRecipeStats` hook
   - Added `invalidateCharacterRecipes` helper
   - Updated `invalidateAllUserData` to include character-based herbalism
   - Added `prefetchCharacterHerbalism` method

4) ✅ Migrated recipes page to character-based
   - Uses `useCharacter`, `useCharacterRecipesNew`, `useCharacterRecipeStats`
   - Uses `unlockCharacterRecipeWithCode` and `invalidateCharacterRecipes`
   - Added character requirement check with CTA

5) ✅ Deprecated legacy modules
   - `src/lib/inventory.ts` - entire module @deprecated
   - `src/lib/brewing.ts` - DB functions @deprecated (pure utilities kept)
   - `src/lib/recipes.ts` - DB functions @deprecated

**Files modified:**
- `src/lib/db/biomes.ts` (new)
- `src/lib/db/characters.ts` (added functions)
- `src/lib/db/characterInventory.ts` (added unlockCharacterRecipeWithCode)
- `src/lib/db/index.ts` (exports biomes)
- `src/lib/hooks/queries.ts` (new hooks + invalidation)
- `src/app/forage/page.tsx`, `inventory/page.tsx`, `edit-character/page.tsx`, `recipes/page.tsx`

**Build verified:** ✅ Passes

## Post-Phase 2 Follow-ups (2026-01-01) ✅ COMPLETED
- Create-character reference data now uses `useSkills`/`useArmorSlots` hooks; removed local fetch state.
- Edit-character armor slots now use `useArmorSlots` hook; removed manual fetch in character load.
- Removed unused `supabase` imports from inventory, forage, edit-character pages.
- Kept legacy profile-based React Query hooks, marked `@deprecated` to guide migration while avoiding breakage.

## Phase 3: Refactor Monolith Pages (modularization)
1) Inventory page
   - Why: 2205 lines with UI, data, and multiple modals in one file.
   - Files: src/app/inventory/page.tsx.
   - Fix: split into feature modules (InventoryPage, EquipmentSection, HerbalismSection, Tabs, Modals), move logic into hooks/helpers.
2) Brew page
   - Why: complex logic + UI in one file; many derived computations and phase transitions.
   - Files: src/app/brew/page.tsx.
   - Fix: extract custom hooks for selection, pairing, and execution; componentize phases.
3) Forage + Create/Edit Character
   - Why: large pages with direct data access and multi-step state.
   - Files: src/app/forage/page.tsx, src/app/create-character/page.tsx, src/app/edit-character/page.tsx.
   - Fix: split into smaller UI sections; move data/mutations to hooks.

## Phase 4: Performance & Scalability
1) Lazy-load heavy data
   - Why: templates/materials and large lists are fetched even when unused.
   - Files: src/app/inventory/page.tsx (templates/materials), src/app/brew/page.tsx (recipes).
   - Fix: enable queries only when a tab/modal opens; consider dynamic import for modals.
2) Large-list handling
   - Why: filters and rendering may get slow as inventory grows.
   - Files: inventory and brew herb lists.
   - Fix: debounced search/useDeferredValue; list virtualization if lists are large.
3) Client footprint review
   - Why: all main pages are client components, limiting SSR.
   - Files: src/app/*/page.tsx.
   - Fix: move static scaffolding to server components where feasible.
4) Reduce props drilling in HerbalismSection
   - Why: HerbsTabContent receives 18 props, BrewedTabContent receives 13 - excessive prop passing.
   - Files: src/components/inventory/herbalism/*.tsx
   - Fix: introduce React Context or state container to reduce prop threading; improves maintainability.

## Phase 5: Validation & QA
- Run build and spot-check core flows: login -> create character -> inventory -> forage -> brew.
- Verify error paths: failed fetch/mutation should show user-friendly messages.
- Confirm inventory changes are consistent under rapid updates/multi-tab use.

## Proposed Execution Order (summary)
1) Phase 1: Stabilize behavior (quick wins)
2) Phase 2: Data layer consolidation
3) Phase 3: Modular refactors
4) Phase 4: Performance/scalability
5) Phase 5: Validation
