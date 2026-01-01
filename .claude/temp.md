# Remaining Work Plan (Post-Phase 2) - Status Update

## Status Summary (2026-01-01)
- Step 1: Create-character hook migration - COMPLETED
- Step 2: Edit-character armor slots hook migration - COMPLETED
- Step 3: Remove unused `supabase` imports - COMPLETED
- Step 4: Legacy hooks decision - COMPLETED (kept legacy hooks; added `@deprecated` JSDoc)

## Changes Applied
### Step 1: Create-character hook migration (COMPLETED)
- Replaced `fetchSkills`/`fetchArmorSlots` + local state with `useSkills`/`useArmorSlots`.
- Derived `loadingRef` from hook loading states.

### Step 2: Edit-character hook migration (COMPLETED)
- Replaced manual armor slot fetch with `useArmorSlots`.
- Removed the extra armor slot fetch from `Promise.all`.

### Step 3: Remove unused `supabase` imports (COMPLETED)
- Removed unused `supabase` imports in:
  - `src/app/inventory/page.tsx`
  - `src/app/forage/page.tsx`
  - `src/app/edit-character/page.tsx`

### Step 4: Legacy hooks decision (COMPLETED)
- Kept profile-based hooks for now.
- Added `@deprecated` JSDoc to: `useInventory`, `useBrewedItems`, `useUserRecipes`, `useRecipeStats`, `useUserRecipesForBrewing`.

## Why This Matters
- Aligns static reference data with the React Query pattern already used elsewhere.
- Removes redundant local loading state without changing UX.
- Keeps compatibility while signaling the move to character-based hooks.

## Validation
- Not run in this session (read-only sandbox).
- Recommended: `npm run build` and spot-check create/edit character pages.
