# Remaining Work Plan (Post-Phase 2)

## Scope
Address the remaining gaps identified after implementation review:
- Switch create-character reference data fetching to React Query hooks.
- Switch edit-character armor slots to React Query hook.
- Remove unused `supabase` imports from updated pages.
- Decide on legacy React Query hooks (keep deprecated vs remove).

## Step 1: Create-Character Hook Migration
**Why:** Manual fetch + local loading state is now inconsistent with the rest of the app. Hooks already exist.

**File:** `src/app/create-character/page.tsx`

**Changes:**
1) Replace imports:
   - Remove `fetchSkills`, `fetchArmorSlots` from `@/lib/db/characters`.
   - Add `useSkills`, `useArmorSlots` from `@/lib/hooks`.
2) Remove local state:
   - Delete `skills`, `armorSlots`, `loadingRef` useState declarations.
3) Add hook usage:
   - `const { data: skills = [], isLoading: skillsLoading } = useSkills()`
   - `const { data: armorSlots = [], isLoading: slotsLoading } = useArmorSlots()`
   - `const loadingRef = skillsLoading || slotsLoading`
4) Remove useEffect that calls `fetchSkills()` and `fetchArmorSlots()`.

**Notes:**
- Ensure any logic relying on `loadingRef` continues to work.
- Keep existing error handling behavior (if any) for skill/armor reference data.

## Step 2: Edit-Character Hook Migration
**Why:** Consistency with data layer consolidation; remove manual fetch.

**File:** `src/app/edit-character/page.tsx`

**Changes:**
1) Replace imports:
   - Remove `fetchArmorSlots` from `@/lib/db/characters`.
   - Add `useArmorSlots` from `@/lib/hooks`.
2) Replace state + fetch:
   - Remove `allArmorSlots` local state and removal from `Promise.all`.
   - Add `const { data: allArmorSlots = [] } = useArmorSlots()`.

**Notes:**
- Armor slots are static reference data; hook has `staleTime: Infinity` already.

## Step 3: Remove Unused `supabase` Imports
**Why:** These imports are now unused after refactors and will generate lint noise.

**Files:**
- `src/app/inventory/page.tsx`
- `src/app/forage/page.tsx`
- `src/app/edit-character/page.tsx`

**Action:** Remove `import { supabase } from '@/lib/supabase'` where no longer used.

## Step 4: Legacy Hooks Decision
**Why:** Legacy profile-based hooks remain in `src/lib/hooks/queries.ts`.

**Options:**
1) **Keep (recommended now):**
   - Add `@deprecated` JSDoc on `useInventory`, `useBrewedItems`, `useUserRecipes`, `useRecipeStats`, and `useUserRecipesForBrewing`.
   - Keep query keys and prefetch for legacy until all pages are migrated.
2) **Remove now:**
   - Delete legacy hooks, keys, prefetch, and invalidation.
   - Update any remaining callers first (currently only internal doc references).

**Decision:** pick one before editing `queries.ts`.

## Validation
1) Run `npm run build` (or `cmd /c npm run build` if PowerShell blocks scripts).
2) Spot-check:
   - Create Character wizard loads skills/armor without errors.
   - Edit Character armor section loads slots.
   - No unused import lint warnings.

## Risks
- Minimal for Steps 1–3.
- Step 4 depends on whether any legacy calls still exist; removal without full audit could break older pages.
