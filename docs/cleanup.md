# Phase 1: Stabilize User-Facing Behavior

## Progress Summary
- ✅ **Error Visibility** - COMPLETED
- ✅ **Small Cleanup** - COMPLETED
- ✅ **Atomic Inventory Mutations** - COMPLETED

## Scope (3 items)
1. **Error Visibility** - Surface silent errors as non-blocking warnings ✅
2. **Atomic Inventory Mutations** - Use Supabase RPC/transactions to prevent race conditions ✅
3. **Small Cleanup** - Separate search state per tab in inventory ✅

*Auth gating flicker deprioritized - skeleton approach is working fine.*

---

## 1. Error Visibility ✅ COMPLETED

### Problem
Silent failures (console.error only) in:
- `src/app/create-character/page.tsx:299` - starting money
- `src/app/create-character/page.tsx:312` - starting armor
- `src/app/create-character/page.tsx:321` - recipe initialization
- `src/app/profile/page.tsx:384-390` - armor mutations

### Implementation

**Create `src/components/ui/WarningDisplay.tsx`:**
```tsx
type WarningDisplayProps = {
  message: string
  onDismiss?: () => void
  className?: string
}

export function WarningDisplay({ message, onDismiss, className = '' }: WarningDisplayProps) {
  return (
    <div className={`bg-amber-900/30 border border-amber-700 rounded-lg p-4 ${className}`}>
      <p className="text-amber-300">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-200 text-sm mt-2">
          Dismiss
        </button>
      )}
    </div>
  )
}
```

**Update `src/app/create-character/page.tsx`:**
- Add `const [warnings, setWarnings] = useState<string[]>([])`
- Replace console.error calls with `setWarnings(prev => [...prev, 'message'])`
- Render warnings on success page

**Update `src/app/profile/page.tsx`:**
- Surface armor mutation errors via existing error state

### Files ✅ ALL COMPLETED
- ✅ `src/components/ui/WarningDisplay.tsx` - Created with dismissible warning UI
- ✅ `src/components/ui/index.ts` - Added export for WarningDisplay
- ✅ `src/app/create-character/page.tsx` - Added warnings state, replaced console.error with setWarnings, displays warnings before redirect
- ✅ `src/app/profile/page.tsx` - Added armorError state in CharacterView, surfaces armor mutation errors with ErrorDisplay

---

## 2. Atomic Inventory Mutations ✅ COMPLETED

### Problem
All mutations use SELECT-then-modify pattern (race conditions):
- `src/lib/db/characterInventory.ts:66-93` - addCharacterHerbs
- `src/lib/db/characterInventory.ts:98-129` - removeCharacterHerbs
- `src/lib/db/characterInventory.ts:187-216` - consumeCharacterBrewedItem

**Critical:** Batch brewing (`brew/page.tsx:493-578`) removes herbs first, then creates items in loop. Partial failure loses herbs.

### Implementation

**Create `supabase/migrations/009_atomic_inventory_functions.sql`:**

4 RPC functions:
1. `add_character_herbs(p_character_id, p_herb_id, p_quantity)` - atomic upsert
2. `remove_character_herbs(p_character_id, p_herb_id, p_quantity)` - with row lock + validation
3. `consume_character_brewed_item(p_brewed_id, p_quantity)` - with row lock + validation
4. `brew_items(p_character_id, p_herbs_to_remove, p_brew_type, p_effects, ...)` - atomic multi-step

Key SQL patterns:
- `FOR UPDATE` row locking
- JSONB parameter for herb arrays
- Transaction rollback on exception
- `SECURITY DEFINER` with ownership check

**Update `src/lib/db/characterInventory.ts`:**
- Replace implementations with `supabase.rpc()` calls
- Add new `brewItems()` function for atomic brewing

**Update `src/app/brew/page.tsx`:**
Refactor `executeBrewWithEffects`:
1. Roll all dice first, count successes
2. Build `herbsToRemove` array from selected quantities
3. Single call to `brewItems()` RPC with success count
4. If RPC fails, nothing is consumed (atomic)

### Files ✅ ALL COMPLETED
- ✅ `supabase/migrations/009_atomic_inventory_functions.sql` - Created with 4 RPC functions
  - `add_character_herbs` - Atomic upsert with ownership check
  - `remove_character_herbs` - Row locking with validation
  - `consume_character_brewed_item` - Row locking with validation
  - `brew_items` - Atomic multi-step transaction for brewing
  - All functions use SECURITY DEFINER with ownership checks
  - All functions use FOR UPDATE row locking and JSONB parameters
- ✅ `src/lib/db/characterInventory.ts` - Updated to use RPC calls
  - Replaced addCharacterHerbs, removeCharacterHerbs, consumeCharacterBrewedItem with supabase.rpc() calls
  - Added new brewItems() function that calls the brew_items RPC
- ✅ `src/app/brew/page.tsx` - Updated to use atomic brewItems
  - Refactored executeBrew to use brewItems() RPC atomically
  - Refactored executeBrewWithEffects to build herbsToRemove array and call brewItems() RPC atomically
  - Removed unused imports (removeCharacterHerbs, addCharacterBrewedItem)
- ✅ Migration deployed to Supabase via `npm run db:push`
- ✅ TypeScript types regenerated via `npm run db:types`

---

## 3. Small Cleanup ✅ COMPLETED

### Problem
Shared `searchQuery` state across inventory tabs (weapons/items).

### Implementation
In `src/app/inventory/page.tsx`:
- Remove shared `searchQuery` state from EquipmentSection
- Add local `searchQuery` state in each tab component (WeaponsTab, ItemsTab)

### Files ✅ COMPLETED
- ✅ `src/app/inventory/page.tsx` - Removed shared searchQuery from EquipmentSection (line 269), added local searchQuery state to WeaponsTab (line 379) and ItemsTab (line 570). Each tab now has independent search state.

---

## Implementation Order

1. ✅ **Error Visibility** (low risk, quick) - DONE
2. ✅ **Small Cleanup** (low risk) - DONE
3. ✅ **Atomic Mutations** (higher risk, requires testing) - DONE
   - ✅ Create migration with 4 RPC functions
   - ✅ Update client code to use RPC calls
   - ✅ Migration deployed to remote Supabase
   - ✅ TypeScript types regenerated

---

## Testing Checklist

### Error Visibility ✅
- [ ] Create character with failing secondary saves → warnings display
- [ ] Warnings are dismissible
- [ ] Profile page shows armor errors when mutations fail

### Atomic Mutations ✅ (DEPLOYED - READY TO TEST)
- [ ] Forage adds herbs correctly
- [ ] Single brew (success/failure) works
- [ ] Batch brew partial success creates correct count
- [ ] Insufficient herbs shows error, no changes made

### Search State ✅
- [ ] Search in weapons tab, switch to items → items search empty
- [ ] Search in items tab, switch to weapons → weapons search empty

---

## Risks (Mitigated)

1. ✅ **RLS + SECURITY DEFINER:** All RPC functions include ownership checks via `auth.uid()`.

2. ✅ **Type regeneration:** Types regenerated after migration deployment.

---

## Phase 1 Complete! 🎉

All 3 items from Phase 1 have been implemented and deployed. The application is now more stable with:
- User-visible error messages instead of silent console failures
- Atomic database operations preventing race conditions and data loss
- Independent search state per inventory tab
# Herbalism Tool - Data Layer Fixes

## Status Summary
Legend: ? Completed | ? Not started

| Phase | Status |
|-------|--------|
| Phase 1: Stabilize User-Facing Behavior | ? COMPLETED |
| Phase 2: Data Layer Consolidation | ? COMPLETED (2026-01-01) |
| Phase 3: Refactor Monolith Pages | ? NOT STARTED |

---

# Phase 1: Stabilize User-Facing Behavior ? COMPLETED

## Summary
- ? Error Visibility - Surface silent errors as warnings
- ? Atomic Inventory Mutations - RPC functions for race-condition-free operations
- ? Small Cleanup - Separate search state per tab

*Details in git history and scratchpad.md*

---

# Phase 2: Data Layer Consolidation ? COMPLETED

## Context Summary

Phase 2 builds on Phase 1's atomic RPC pattern. This revision incorporates codex review feedback:

**Goals:**
1. Move Supabase calls out of UI pages into db layer
2. Add atomic RPC for item consumption (with full safeguards)
3. Migrate React Query hooks from legacy user-based to character-based
4. **Migrate recipes page to character-based** (new scope)
5. Properly deprecate legacy modules (after migration complete)

**Key decisions:**
- **Naming:** `consumeCharacterItem` (not `useCharacterItem` - conflicts with React hook convention)
- **Atomicity:** Create RPC `consume_character_item` with full safeguards matching `009_atomic_inventory_functions.sql`
- **File org:** Create `src/lib/db/biomes.ts` for biome reference data
- **Type reuse:** Import `BiomeHerb` from `types.ts`, don't redefine
- **Deprecation:** Only after all migrations complete (including recipes page)
- **Scope:** Full migration including recipes page

---

## Review Issues Addressed

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | High | RPC missing safeguards | Rewrite with `auth.uid()`, `SET search_path`, quantity validation, `updated_at`, exception handling, `GRANT EXECUTE` |
| 2 | High | Recipes page not in migration | Add full recipes page migration with character-based hooks |
| 3 | High | CharacterUpdate type misaligned | Align with `types.ts:373` and `edit-character/page.tsx:229` - include stats, hp, money, appearance fields |
| 4 | Medium | Deprecation conflicts | Deprecate only after all migrations complete |
| 5 | Medium | BiomeHerb type duplication | Import from `types.ts:46`, don't redefine |
| 6 | Medium | RPC return shape inconsistent | Use `{ success: true }` on success, `{ error: "msg" }` on failure |
| 7 | Medium | updateCharacter null user risk | Rely on RLS instead of inline `auth.getUser()` which can silently no-op if user is null |
| 8 | Medium | unlockCharacterRecipeWithCode bugs | Add empty-code guard, use `maybeSingle()` instead of `single()` to avoid PGRST116 |
| 9 | Medium | Hooks migration incomplete | Update `queryKeys`, `invalidateAllUserData`, and `usePrefetch` for character-based herbalism |
| 10 | Low | updateCharacter typing | Define explicit `CharacterUpdate` type with `updated_at` handling |

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `supabase/migrations/010_atomic_item_functions.sql` | New RPC with full safeguards | 1 |
| `src/lib/db/biomes.ts` | **NEW** - import BiomeHerb from types.ts | 2 |
| `src/lib/db/characters.ts` | Add 4 functions + CharacterUpdate type | 2 |
| `src/lib/db/characterInventory.ts` | Add `unlockCharacterRecipeWithCode()` | 2 |
| `src/lib/db/index.ts` | Export biomes module | 2 |
| `src/lib/hooks/queries.ts` | Add `useCharacterRecipeStats`, `invalidateCharacterRecipes` | 3 |
| `src/app/forage/page.tsx` | Replace 1 direct Supabase call | 4 |
| `src/app/inventory/page.tsx` | Replace 3 direct Supabase calls | 4 |
| `src/app/edit-character/page.tsx` | Use `updateCharacter()` | 4 |
| `src/app/recipes/page.tsx` | **NEW** - Migrate to character-based hooks | 4 |
| `src/lib/brewing.ts` | @deprecated on DB functions (after migration) | 5 |
| `src/lib/inventory.ts` | @deprecated on all (after migration) | 5 |
| `src/lib/recipes.ts` | @deprecated on DB functions (after migration) | 5 |

---

## Step 1: Create Atomic RPC (with full safeguards) ? COMPLETED

**Why:** `handleUseOne` reads quantity client-side, then conditionally deletes/decrements. Race condition with multiple tabs. Original RPC was missing critical safeguards from `009_atomic_inventory_functions.sql`.

**Status:** Migration created, deployed, and types generated. Function signature confirmed in `database.types.ts:1101-1104`.

**File:** `supabase/migrations/010_atomic_item_functions.sql`

```sql
CREATE OR REPLACE FUNCTION consume_character_item(
  p_character_id UUID,
  p_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty INT;
  v_item_character_id UUID;
BEGIN
  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('error', 'Quantity must be positive');
  END IF;

  -- Verify ownership via auth.uid()
  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Lock row and get current state
  SELECT quantity, character_id INTO v_current_qty, v_item_character_id
  FROM character_items WHERE id = p_item_id FOR UPDATE;

  IF v_item_character_id IS NULL THEN
    RETURN json_build_object('error', 'Item not found');
  END IF;
  IF v_item_character_id != p_character_id THEN
    RETURN json_build_object('error', 'Not your item');
  END IF;
  IF v_current_qty < p_quantity THEN
    RETURN json_build_object('error', 'Insufficient quantity');
  END IF;

  -- Perform mutation
  IF v_current_qty <= p_quantity THEN
    DELETE FROM character_items WHERE id = p_item_id;
  ELSE
    UPDATE character_items
    SET quantity = quantity - p_quantity, updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  RETURN json_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION consume_character_item TO authenticated;
```

**Safeguards added (matching 009 pattern):**
- `SET search_path = public` - prevents schema injection
- `auth.uid()` ownership check - verifies character belongs to caller
- Quantity validation - rejects `<= 0`
- `updated_at = NOW()` on UPDATE
- `EXCEPTION WHEN OTHERS` - catches and returns DB errors
- `GRANT EXECUTE TO authenticated` - enables RLS bypass for authenticated users
- `{ success: true }` return shape - matches existing RPCs

**Deploy:** `npm run db:push` ?? `npm run db:types`

---

## Step 2: Create Biomes Module (reuse existing type) ? COMPLETED

**Why:** `fetchBiomeHerbs` is biome reference data, not character data. Type already exists in `types.ts:46-52`.

**Status:** Created `src/lib/db/biomes.ts` with BiomeHerb import and updated `src/lib/db/index.ts` to export biomes module.

**File:** `src/lib/db/biomes.ts` (NEW)

```typescript
import { supabase } from '../supabase'
import type { Herb, BiomeHerb } from '../types'  // Import existing type - DO NOT redefine

export async function fetchBiomeHerbs(biomeId: number): Promise<{
  data: BiomeHerb[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('biome_herbs')
    .select('id, biome_id, herb_id, weight, herbs(*)')
    .eq('biome_id', biomeId)

  if (error) return { data: null, error: error.message }

  const transformed = (data || []).map(bh => ({
    ...bh,
    herbs: bh.herbs as unknown as Herb
  })) as BiomeHerb[]

  return { data: transformed, error: null }
}
```

**Also:** Update `src/lib/db/index.ts` to export from biomes.

---

## Step 3: Add Functions to characters.ts ? COMPLETED

**Status:** Added CharacterUpdate type and 4 functions (updateCharacter, deleteCharacterWeapon, consumeCharacterItem, deleteCharacterItem) to `src/lib/db/characters.ts`.

**File:** `src/lib/db/characters.ts`

### 3.1 Define CharacterUpdate type
```typescript
// Aligned with types.ts Character (line 373) and edit-character/page.tsx payload (line 229)
type CharacterUpdate = Partial<Pick<Character,
  | 'name' | 'appearance' | 'level'
  | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | 'hon'  // Stats
  | 'hp_current' | 'hp_custom_modifier'                     // HP
  | 'platinum' | 'gold' | 'silver' | 'copper'               // Money
>>
```

### 3.2 `updateCharacter(characterId, updates)`
```typescript
export async function updateCharacter(
  characterId: string,
  updates: CharacterUpdate
): Promise<{ error: string | null }> {
  // RLS ensures user can only update their own characters, so we don't need user_id filter.
  // This avoids the risk of eq('user_id', undefined) silently returning no rows.
  const { error } = await supabase
    .from('characters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', characterId)

  return { error: error?.message ?? null }
}
```
Replaces `edit-character/page.tsx:248-257`. Explicitly sets `updated_at`. Relies on RLS for ownership check rather than inline `auth.getUser()` which can silently no-op if user is null.

### 3.3 `deleteCharacterWeapon(weaponId)`
Replaces `inventory/page.tsx:393-405`

### 3.4 `consumeCharacterItem(characterId, itemId, quantity)`
Uses RPC. Replaces `inventory/page.tsx:596-618`

### 3.5 `deleteCharacterItem(itemId)`
Replaces `inventory/page.tsx:620-632`

---

## Step 4: Add Character Recipe Unlock With Code

**Why:** Recipes page currently uses `unlockRecipeWithCode(profileId, code)` from `recipes.ts`. Need character-based equivalent.

**File:** `src/lib/db/characterInventory.ts`

```typescript
export async function unlockCharacterRecipeWithCode(
  characterId: string,
  code: string
): Promise<{ success: boolean; recipe: Recipe | null; error: string | null }> {
  const normalizedCode = code.trim().toLowerCase()

  // Guard against empty code (matches legacy unlockRecipeWithCode behavior)
  if (!normalizedCode) {
    return { success: false, recipe: null, error: 'Please enter a code' }
  }

  // Find secret recipe with matching code
  const { data: recipe, error: findError } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_secret', true)
    .ilike('unlock_code', normalizedCode)
    .single()

  if (findError || !recipe) {
    return { success: false, recipe: null, error: 'Invalid unlock code' }
  }

  // Check if already unlocked - use maybeSingle() to avoid PGRST116 when no row exists
  const { data: existing, error: checkError } = await supabase
    .from('character_recipes')
    .select('id')
    .eq('character_id', characterId)
    .eq('recipe_id', recipe.id)
    .maybeSingle()

  if (checkError) {
    return { success: false, recipe: null, error: checkError.message }
  }

  if (existing) {
    return { success: false, recipe: null, error: 'Recipe already unlocked' }
  }

  // Unlock recipe
  const { error: insertError } = await supabase
    .from('character_recipes')
    .insert({ character_id: characterId, recipe_id: recipe.id })

  if (insertError) {
    return { success: false, recipe: null, error: insertError.message }
  }

  return { success: true, recipe: recipe as Recipe, error: null }
}
```

---

## Step 5: Update queries.ts Hooks

**File:** `src/lib/hooks/queries.ts`

### 5.1 Add query key
```typescript
// In queryKeys object (around line 48)
characterRecipeStats: (characterId: string | undefined) => ['characterRecipeStats', characterId] as const
```

### 5.2 Add `useCharacterRecipeStats` hook
```typescript
export function useCharacterRecipeStats(characterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.characterRecipeStats(characterId),
    queryFn: async () => {
      // Compute from character_recipes + recipes table
      // Return: { known: number; totalBase: number; secretsUnlocked: number }
    },
    enabled: !!characterId
  })
}
```

### 5.3 Add `invalidateCharacterRecipes` helper
```typescript
// In useInvalidate() return object
invalidateCharacterRecipes: (characterId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.characterRecipesNew(characterId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.characterRecipeStats(characterId) })
}
```

### 5.4 Update `invalidateAllUserData` (line ~538)
Add character-based herbalism cache invalidation:
```typescript
invalidateAllUserData: () => {
  // Legacy profile-based (keep until fully migrated)
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['brewedItems'] })
  queryClient.invalidateQueries({ queryKey: ['userRecipes'] })
  queryClient.invalidateQueries({ queryKey: ['recipeStats'] })

  // Character-based
  queryClient.invalidateQueries({ queryKey: ['character'] })
  queryClient.invalidateQueries({ queryKey: ['characterSkills'] })
  queryClient.invalidateQueries({ queryKey: ['characterArmor'] })
  queryClient.invalidateQueries({ queryKey: ['characterWeaponSlots'] })
  queryClient.invalidateQueries({ queryKey: ['characterQuickSlots'] })
  queryClient.invalidateQueries({ queryKey: ['characterWeapons'] })
  queryClient.invalidateQueries({ queryKey: ['characterItems'] })

  // Character-based herbalism (NEW)
  queryClient.invalidateQueries({ queryKey: ['characterHerbs'] })
  queryClient.invalidateQueries({ queryKey: ['characterBrewedItems'] })
  queryClient.invalidateQueries({ queryKey: ['characterRecipesNew'] })
  queryClient.invalidateQueries({ queryKey: ['characterRecipeStats'] })
}
```

### 5.5 Update `usePrefetch` (line ~560)
Add character-based prefetch methods alongside legacy ones:
```typescript
// In usePrefetch() return object, add:
prefetchCharacterHerbalism: (characterId: string | null) => {
  if (!characterId) return

  queryClient.prefetchQuery({
    queryKey: queryKeys.characterHerbs(characterId),
    queryFn: () => fetchers.characterHerbs(characterId),
  })
  queryClient.prefetchQuery({
    queryKey: queryKeys.characterBrewedItems(characterId),
    queryFn: () => fetchers.characterBrewedItems(characterId),
  })
  queryClient.prefetchQuery({
    queryKey: queryKeys.characterRecipesNew(characterId),
    queryFn: () => fetchers.characterRecipesNew(characterId),
  })
}
```

**Note:** The legacy profile-based keys (`inventory`, `brewedItems`, `userRecipes`, `recipeStats`) and prefetch methods should be kept until all pages are migrated, then removed in Step 8 deprecation.

---

## Step 6: Migrate Recipes Page

**Why:** Recipes page (`src/app/recipes/page.tsx`) still uses user-based hooks. If we deprecate `recipes.ts` without migrating, page breaks.

**File:** `src/app/recipes/page.tsx`

**Changes:**
1. Get `characterId` from character context (require character selection like other herbalism pages)
2. Replace `useUserRecipes(profileId)` ?? `useCharacterRecipesNew(characterId)`
3. Replace `useRecipeStats(profileId)` ?? `useCharacterRecipeStats(characterId)`
4. Replace `unlockRecipeWithCode(profileId, code)` ?? `unlockCharacterRecipeWithCode(characterId, code)`
5. Replace `invalidateRecipes(profileId)` ?? `invalidateCharacterRecipes(characterId)`
6. Map `CharacterRecipe[]` to `Recipe[]` for rendering (filter missing joins)

```typescript
const recipes = useMemo(() => {
  return characterRecipes
    .filter((cr: CharacterRecipe) => cr.recipe)
    .map((cr: CharacterRecipe) => cr.recipe as Recipe)
    .sort((a, b) => a.name.localeCompare(b.name))
}, [characterRecipes])
```

**Current imports to replace:**
- `import { useUserRecipes, useRecipeStats } from '@/lib/hooks/queries'`
- `import { unlockRecipeWithCode } from '@/lib/recipes'`

**Note:** Add auth/character gating similar to other herbalism pages (redirect if not authenticated; show CTA if no character).

---

## Step 7: Update Other UI Pages

### 7.1 `inventory/page.tsx`
- Line ~393: `handleDelete` ?? use `deleteCharacterWeapon()`
- Line ~596: `handleUseOne` ?? use `consumeCharacterItem(characterId, itemId, 1)`
- Line ~620: `handleDeleteAll` ?? use `deleteCharacterItem()`
- **Note:** Need to pass `characterId` to ItemsTab

### 7.2 `forage/page.tsx`
- Line ~128: Replace inline Supabase call with `fetchBiomeHerbs(biomeId)`

### 7.3 `edit-character/page.tsx`
- Line ~248: Use `updateCharacter(character.id, updates)`
- Line ~135: Use `useArmorSlots()` hook instead of manual fetch

---

## Step 8: Deprecate Legacy Modules (LAST)

**Critical:** Only after all migrations complete, including recipes page.

### `src/lib/inventory.ts`
Entire module deprecated (all DB calls to legacy `user_inventory` table).

### `src/lib/brewing.ts`
**Only** deprecate DB functions:
- `fetchRecipes`, `fetchUserRecipes`, `saveBrewedItem`, `getBrewedItems`, `removeBrewedItem`

**Keep** pure utilities (no DB calls):
- `buildElementPool`, `getTotalElements`, `findRecipeForPair`, `canCombineEffects`
- `parseTemplateVariables`, `fillTemplate`, `computeBrewedDescription`

### `src/lib/recipes.ts`
Deprecate DB functions:
- `getUserRecipes`, `initializeBaseRecipes`, `unlockRecipeWithCode`, `getRecipeStats`

---

## Current Progress (2026-01-01)

**? ALL STEPS COMPLETED:**
- ? Step 1: Migration + RPC deployed, types generated
- ? Step 2: Biomes module created and exported
- ? Step 3: Character functions added (updateCharacter, deleteCharacterWeapon, consumeCharacterItem, deleteCharacterItem)
- ? Step 4: Added `unlockCharacterRecipeWithCode` to `characterInventory.ts`
- ? Step 5: Updated `queries.ts` hooks (characterRecipeStats, invalidation, prefetch)
- ? Step 6: Migrated forage/page.tsx to use fetchBiomeHerbs
- ? Step 7: Migrated inventory/page.tsx to use new db functions
- ? Step 8: Migrated edit-character/page.tsx to use updateCharacter
- ? Step 9: Migrated recipes/page.tsx to character-based hooks
- ? Step 10: Deprecated legacy modules with @deprecated tags
- ? Step 11: Build verification passed

**Phase 2: Data Layer Consolidation - COMPLETE**

---

## Implementation Order ? ALL COMPLETE

1. ? Migration SQL ?? `npm run db:push` ?? `npm run db:types`
2. ? `biomes.ts` (new file)
3. ? `characters.ts` (add functions)
4. ? `characterInventory.ts` (add unlock with code)
5. ? `queries.ts` (add hooks + invalidation)
6. ? `db/index.ts` (export biomes)
7. ? `forage/page.tsx` (lowest risk UI change)
8. ? `inventory/page.tsx`
9. ? `edit-character/page.tsx`
10. ? `recipes/page.tsx` (highest risk - test thoroughly)
11. ? Legacy deprecation (last)
12. ? Build verification

---

## Testing Checklist

- ? RPC `consume_character_item` works with auth
- ? RPC rejects unauthorized access (wrong user)
- ? RPC rejects invalid quantity (`<= 0`)
- ? RPC returns `{ success: true }` on success
- ? Forage page loads biome herbs
- ? Inventory item use decrements correctly (qty > 1)
- ? Inventory item use deletes at qty = 1
- ? Edit character saves changes with `updated_at`
- ? Recipes page shows character recipes
- ? Recipe unlock with code works
- ? Recipe stats display correctly
- ? Build passes

---

## Next Steps

Phase 2 is complete. Next work should be **Phase 3: Refactor Monolith Pages** (see scratchpad.md):
1. Inventory page - split 2205-line file into feature modules
2. Brew page - extract custom hooks for selection, pairing, execution
3. Forage + Create/Edit Character - split into smaller UI sections


# Phase 3: Inventory Page Refactor Plan

## Goal
Extract `src/app/inventory/page.tsx` (2333 lines) into modular components, reducing it to ~150-200 lines of orchestration code.

## Progress

| Batch | Status | Lines Removed | page.tsx After |
|-------|--------|---------------|----------------|
| Batch 1: Types + Modals | COMPLETE | ~878 lines | 1455 lines |
| Batch 2: Equipment | COMPLETE | ~554 lines | 901 lines |
| Batch 3: Herbalism | COMPLETE | ~705 lines | 196 lines |

## Current State (After Batch 3) - COMPLETE ✓
- page.tsx: **196 lines** (down from 2333 - **91.6% reduction!**)
- Types and helper functions extracted to `types.ts`
- AddWeaponModal and AddItemModal extracted to `modals/`
- Equipment components extracted to `equipment/` (EquipmentSection, WeaponsTab, ItemsTab, WeaponCard, ItemCard)
- Herbalism components extracted to `herbalism/` (HerbalismSection, HerbsTabContent, BrewedTabContent, FilterButton)
- Existing `src/components/inventory/` has 3 small components (HerbRow, BrewedItemCard, ElementSummary)

## Target Structure
```
src/components/inventory/
├── index.ts                    # Barrel export (existing, will expand)
├── types.ts                    # Shared types for inventory
├── HerbRow.tsx                 # (existing)
├── BrewedItemCard.tsx          # (existing)
├── ElementSummary.tsx          # (existing)
├── modals/
│   ├── index.ts
│   ├── AddWeaponModal.tsx      # ~470 lines
│   └── AddItemModal.tsx        # ~365 lines
├── equipment/
│   ├── index.ts
│   ├── EquipmentSection.tsx    # ~110 lines
│   ├── WeaponsTab.tsx          # ~90 lines
│   ├── WeaponCard.tsx          # ~90 lines
│   ├── ItemsTab.tsx            # ~145 lines
│   └── ItemCard.tsx            # ~85 lines
└── herbalism/
    ├── index.ts
    ├── HerbalismSection.tsx    # ~330 lines
    ├── HerbsTabContent.tsx     # ~185 lines
    ├── BrewedTabContent.tsx    # ~95 lines
    └── FilterButton.tsx        # ~25 lines
```

---

## Batch 1: Types + Modals (~835 lines) - COMPLETE

- [x] Step 1.1: Create types.ts
- [x] Step 1.2: Extract AddWeaponModal
- [x] Step 1.3: Extract AddItemModal
- [x] Step 1.4: Create modals barrel export
- [x] Step 1.5: Update main barrel export
- [x] Step 1.6: Update page.tsx imports
- [x] Verify: `npm run build` passes

---

## Batch 2: Equipment Components (~554 lines) - COMPLETE

- [x] Step 2.1: Extract WeaponCard
- [x] Step 2.2: Extract ItemCard
- [x] Step 2.3: Extract WeaponsTab
- [x] Step 2.4: Extract ItemsTab
- [x] Step 2.5: Extract EquipmentSection
- [x] Step 2.6: Create equipment barrel export
- [x] Step 2.7: Update main index.ts and page.tsx
- [x] Verify: `npm run build` passes

---

## Batch 3: Herbalism Components (~705 lines) - COMPLETE

- [x] Step 3.1: Extract FilterButton
- [x] Step 3.2: Extract HerbsTabContent
- [x] Step 3.3: Extract BrewedTabContent
- [x] Step 3.4: Extract HerbalismSection
- [x] Step 3.5: Create herbalism barrel export
- [x] Step 3.6: Update main index.ts and page.tsx
- [x] Verify: `npm run build` passes

---

## Final State

**page.tsx (~150-200 lines):**
- Auth/profile guards
- Data fetching hooks (useCharacter, useCharacterWeapons, etc.)
- Top-level state (mainTab, showAddWeapon, showAddItem)
- Render: PageLayout > tabs > EquipmentSection | HerbalismSection
- Modal conditionals

**Component count:**
- 11 new component files
- 4 barrel exports (index.ts files)
- 1 types file

---

## Verification Checklist

Batch 1:
- [x] `npm run build` passes
- [x] No TypeScript errors
- [x] Manual test: navigate to /inventory, switch tabs, open modals
- [x] Commit with descriptive message

Batch 2:
- [x] `npm run build` passes
- [x] No TypeScript errors
- [ ] Manual test: navigate to /inventory, switch tabs, open modals
- [ ] Commit with descriptive message

Batch 3:
- [x] `npm run build` passes
- [x] No TypeScript errors
- [ ] Manual test: navigate to /inventory, switch tabs, open modals
- [ ] Commit with descriptive message

---

## Files Modified Summary

| Action | File |
|--------|------|
| CREATE | src/components/inventory/types.ts |
| CREATE | src/components/inventory/modals/index.ts |
| CREATE | src/components/inventory/modals/AddWeaponModal.tsx |
| CREATE | src/components/inventory/modals/AddItemModal.tsx |
| CREATE | src/components/inventory/equipment/index.ts |
| CREATE | src/components/inventory/equipment/EquipmentSection.tsx |
| CREATE | src/components/inventory/equipment/WeaponsTab.tsx |
| CREATE | src/components/inventory/equipment/WeaponCard.tsx |
| CREATE | src/components/inventory/equipment/ItemsTab.tsx |
| CREATE | src/components/inventory/equipment/ItemCard.tsx |
| CREATE | src/components/inventory/herbalism/index.ts |
| CREATE | src/components/inventory/herbalism/HerbalismSection.tsx |
| CREATE | src/components/inventory/herbalism/HerbsTabContent.tsx |
| CREATE | src/components/inventory/herbalism/BrewedTabContent.tsx |
| CREATE | src/components/inventory/herbalism/FilterButton.tsx |
| MODIFY | src/components/inventory/index.ts |
| MODIFY | src/app/inventory/page.tsx |

# Batch 2: useBrewState Hook Extraction Plan

## Progress Update

**✓ Step 2a COMPLETE** - Hook shell with types established
**✓ Step 2b COMPLETE** - useState declarations moved to hook
**✓ Step 2c COMPLETE** - All 11 useMemo computations implemented
**✓ Step 2d COMPLETE** - All actions implemented + browser back handling
**✓ POST-EXTRACTION BUGFIXES COMPLETE** - See below

**Final status:**
- `src/app/brew/page.tsx`: 813 → **559 lines** (254 lines extracted)
- `src/lib/hooks/useBrewState.ts`: **~452 lines** (8 useState + 11 useMemo + 18 actions)
- `npm run build`: ✓ Passing

---

## Post-Extraction Bugfixes (Session 2026-01-03)

Manual testing + code review revealed 4 issues after extraction. Root cause analysis performed.

### Bug 1: Recipe list empty in both modes (FIXED)
**Symptom:** By-recipe mode showed "No recipes known", by-herbs pairing showed "No effects selected"
**Root cause:** Transcription error during extraction - `cr.recipe` (correct) became `cr.recipes` (wrong)
**Fix:** `useBrewState.ts` lines 105-106: `cr.recipes` → `cr.recipe`

**Why it happened:**
- Original code: `.filter((cr: CharacterRecipe) => cr.recipe)` with explicit type
- Extracted code: `.filter((cr) => cr.recipes)` - typo + dropped type annotation
- Used `as unknown as Recipe` which bypassed TypeScript, hiding the error

**Prevention:** Updated CLAUDE.md gotcha #3 to warn against `as unknown as Type` pattern.

### Bug 2: Back button didn't clear element pairings (PARTIALLY FIXED)
**Symptom:** Going back from pairing phase kept old pairs; re-entering showed stale state
**Root cause:** Pre-existing design gap - `handleBrowserBack` only changed phase, never cleared state
**Initial fix:** Added `setAssignedPairs([])` and `setChoices({})` calls when going back from `pair-elements`
**Issue:** Fix didn't work reliably - stale closure in `handleBrowserBack` caused condition to fail silently

### Bug 3: Stale pairs still present after back+forward (FIXED)
**Symptom:** Back from pairing → modify herbs → forward to pairing → old pairs still there
**Root cause:** Bug 2 fix relied on `handleBrowserBack` which had stale closure issues
**Fix:** Belt-and-suspenders approach - clear state in `proceedToPairing()` action instead:
```typescript
proceedToPairing: () => {
  if (totalHerbsSelected === 0) return
  setAssignedPairs([])  // Always clear pairs when entering pairing phase
  setChoices({})        // Also clear any stale choices
  setPhase({ phase: 'pair-elements', selectedHerbs })
},
```
**Location:** `useBrewState.ts` lines 356-361

### Bug 4: Stale choices in by-recipe path (FIXED - Codex review)
**Symptom:** In by-recipe mode, selecting Recipe A → making choices → going back → selecting Recipe B → proceeding forward → old choices from Recipe A persist
**Root cause:** By-herbs path was fixed for Bugs 2/3, but same pattern wasn't applied to by-recipe path
- `proceedFromRecipeMode` entered `make-choices` without clearing `choices`
- `handleBrowserBack` from `make-choices` in by-recipe mode didn't clear `choices`
**Fix:** Added `setChoices({})` in two locations:
```typescript
// 1. handleBrowserBack for by-recipe (line 243)
if (brewMode === 'by-recipe') {
  setChoices({})  // Clear choices when going back (matches by-herbs behavior)
  setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
}

// 2. proceedFromRecipeMode before entering make-choices (line 399)
if (allChoices.length > 0) {
  setChoices({})  // Clear stale choices from previous recipe selections
  setPhase({ phase: 'make-choices', pairedEffects: effects, selectedHerbs })
  return
}
```
**Locations:** `useBrewState.ts` lines 243 and 399
**Why it happened:** Bugs 2/3 only fixed by-herbs path; by-recipe path oversight

---

## What's Left: Manual Testing

All code changes complete. Need manual verification:

- [x] By-herbs: browser back at each phase (should clear state) - **verified working**
- [ ] By-herbs: select → pair → choices → brew → result
- [ ] By-recipe: select → herbs → choices → brew → batch result
- [ ] By-recipe: browser back at each phase
- [ ] Mode switching resets all state
- [ ] No console errors

---

## What's Implemented

- All 8 state variables in hook
- All 11 useMemo computed values
- All 18 actions: `addHerb`, `removeHerb`, `addPair`, `removePair`, `setChoice`, `addRecipeSelection`, `removeRecipeSelection`, `setBatchCount`, `clearHerbSelections`, `switchBrewMode`, `proceedToPairing`, `proceedToChoices`, `proceedToHerbSelection`, `proceedFromRecipeMode`, `handleBrowserBack`, `reset`, `setPhase`, `setMutationError`
- Browser back handling via `handleBrowserBack()` action

**What stays in page.tsx:**
- `executeBrew()` - async DB mutation + profile.brewingModifier
- `executeBrewWithEffects()` - async DB mutation + profile.brewingModifier
- `proceedToBrewing()` - wrapper that calls executeBrew
- `reset()` wrapper - calls actions.reset() + invalidateCharacterHerbs()
- Browser history useEffects (push state, popstate listener)
- Auth redirect useEffect
- All render logic

**Resolved Issues:**
- **P1 (Fixed in 2c):** Added `clearHerbSelections()` action
- **P3 (Fixed in 2c):** `useMemo` import used
- **Type error (Fixed in 2d):** `make-choices` phase doesn't need `selectedRecipes` - hook state already has it

---

## Goal
Extract brew page state management (8 useState, 11 useMemo, browser history) into `useBrewState` custom hook.

**Starting:** 813 lines → **Target:** ~500 lines (~300 lines extracted to hook)

## Risk Assessment
This is the highest-risk extraction because:
- Complex state interdependencies (11 memos depend on 8 state values)
- Browser history side effects
- Two modes with different execution paths

**Mitigation:** Incremental sub-steps with `npm run build` + manual testing after each.

---

## File Structure

```
src/lib/hooks/
├── index.ts          # Add: export * from './useBrewState'
└── useBrewState.ts   # NEW: ~280 lines

src/app/brew/page.tsx # MODIFIED: removes state, keeps render + async execution
```

---

## Execution Steps

### Step 2a: Hook Shell with Types ✓ COMPLETE

**Goal:** Establish hook file with complete types. No functional changes.

**Create `src/lib/hooks/useBrewState.ts`:**
```typescript
// Type definitions only - hook throws "not implemented"
export type UseBrewStateParams = {
  inventory: InventoryItem[]
  characterRecipes: CharacterRecipe[]
}

export type BrewActions = {
  addHerb: (itemId: number) => void
  removeHerb: (itemId: number) => void
  addPair: (el1: string, el2: string) => void
  removePair: (index: number) => void
  setChoice: (variable: string, value: string) => void
  addRecipeSelection: (recipe: Recipe) => void
  removeRecipeSelection: (recipeId: number) => void
  setBatchCount: (count: number) => void
  switchBrewMode: (mode: BrewMode) => void
  proceedToPairing: () => void
  proceedToChoices: () => void
  proceedToHerbSelection: () => void
  proceedFromRecipeMode: () => BrewProceedResult | void
  reset: () => void
  setPhase: (phase: BrewPhase) => void
  setMutationError: (error: string | null) => void
}

export type UseBrewStateReturn = {
  // Core state
  brewMode: BrewMode
  phase: BrewPhase
  // Selection state
  selectedHerbQuantities: Map<number, number>
  assignedPairs: [string, string][]
  choices: Record<string, string>
  selectedRecipes: SelectedRecipe[]
  batchCount: number
  mutationError: string | null
  // Computed (by-herbs)
  selectedHerbs: InventoryItem[]
  totalHerbsSelected: number
  elementPool: Map<string, number>
  remainingElements: Map<string, number>
  pairedEffects: PairedEffect[]
  pairingValidation: { valid: boolean; type: string | null; error?: string }
  requiredChoices: { variable: string; options: string[] | null }[]
  recipes: Recipe[]
  // Computed (by-recipe)
  requiredElements: Map<string, number>
  matchingHerbs: InventoryItem[]
  herbsSatisfyRecipes: boolean
  // Actions
  actions: BrewActions
}
```

**Update `src/lib/hooks/index.ts`:**
```typescript
export * from './queries'
export * from './useBrewState'
```

**Verify:** `npm run build` passes

---

### Step 2b: Move useState Declarations ✓ COMPLETE

**Goal:** Transfer 8 useState hooks to useBrewState. Page calls hook and destructures.

**What moves from page.tsx (lines 92-103):**
- `mutationError` / `setMutationError`
- `brewMode` / `setBrewMode`
- `phase` / `setPhase`
- `selectedHerbQuantities` / `setSelectedHerbQuantities`
- `assignedPairs` / `setAssignedPairs`
- `choices` / `setChoices`
- `selectedRecipes` / `setSelectedRecipes`
- `batchCount` / `setBatchCount`

**Page.tsx changes:**
```typescript
// BEFORE (inline state)
const [brewMode, setBrewMode] = useState<BrewMode>('by-herbs')
// ... 7 more useState

// AFTER (hook usage)
const brewState = useBrewState({ inventory, characterRecipes })
const { brewMode, phase, selectedHerbQuantities, ... } = brewState
const { addHerb, removeHerb, ... } = brewState.actions
```

**Testing checklist:**
- [x] Page loads without errors (build passes)
- [ ] Select herbs - quantities update (NEEDS MANUAL TEST - Step 2c will enable)
- [x] Mode toggle resets state (implemented in hook)
- [x] Phase transitions work (setPhase working)

**Verify:** ✓ `npm run build` passes (Step 2b complete, manual testing pending Step 2c)

---

### Step 2c: Move useMemo Computations ✓ COMPLETE

**Goal:** Transfer 11 useMemo hooks into useBrewState.

**Implementation notes:**
- All 11 useMemo values implemented following dependency order
- Fixed plan errors: `herbs` → `herb`, `element_pair` → `elements`, corrected PairedEffect structure
- Added `clearHerbSelections()` action to fix P1 regression

**Testing after each group:**
- [x] `npm run build` passes
- [ ] Element pool displays correctly in SelectedHerbsSummary (needs manual test)
- [ ] Pairing validation shows errors when mixing types (needs manual test)
- [ ] herbsSatisfyRecipes enables/disables Continue button (needs manual test)

**Verify:** ✓ `npm run build` passes

---

### Step 2d: Move Browser History + Actions (High Risk)

**Goal:** Transfer browser history management and action functions.

**What moves:**

1. **handleBrowserBack callback** (lines 249-267)
   - Already depends on state in hook
   - Returns boolean for popstate handler

2. **useEffect for pushState** (lines 269-274)
   - Pushes history when entering deep phases

3. **useEffect for popstate** (lines 276-283)
   - Listens for back button
   - Calls handleBrowserBack

4. **Action functions** (lines 287-467)
   - addHerb, removeHerb (need inventory access via closure)
   - addPair, removePair
   - proceedToPairing, proceedToChoices
   - reset, switchBrewMode
   - addRecipeSelection, removeRecipeSelection
   - proceedToHerbSelection, proceedFromRecipeMode

**Stay in page.tsx:**
- `executeBrew()` - async DB calls, uses profile.brewingModifier
- `executeBrewWithEffects()` - async DB calls, uses profile.brewingModifier
- `proceedToBrewing()` - calls executeBrew (needs to stay near it)

**Testing checklist:**
- [ ] By-herbs: select → pair → choices → brew → result
- [ ] By-herbs: browser back at each phase
- [ ] By-recipe: select → herbs → choices → brew → batch result
- [ ] By-recipe: browser back at each phase
- [ ] Mode switching resets all state

**Verify:** `npm run build` passes + full manual test of both modes

---

## Confirmed Decisions

1. **Async split:** `executeBrew` and `executeBrewWithEffects` stay in page.tsx. Hook is pure/synchronous.
2. **Reset split:** Hook's `reset()` clears local state only. Page wraps it to also call `invalidateCharacterHerbs(characterId)`.

---

## Critical Gotchas

1. **Closure over inventory in addHerb/removeHerb**: These functions reference `inventory` to check available quantity and find item. Since `inventory` is a hook parameter, it's in closure scope.

2. **handleBrowserBack references selectedRecipes and selectedHerbs**: Both are now in the hook, so this should work. But verify the useCallback dependency array.

3. **reset() calls invalidateCharacterHerbs**: This stays in page.tsx since it needs characterId. Hook's reset() will reset state only; page wraps it.

4. **proceedFromRecipeMode computes choices inline**: This duplicates requiredChoices logic. After extraction, it can use the computed value from the hook.

5. **MAX_HERBS_PER_BREW import**: Hook needs this constant from `@/lib/constants`.

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/hooks/useBrewState.ts` | NEW (~280 lines) |
| `src/lib/hooks/index.ts` | Add export |
| `src/app/brew/page.tsx` | Remove state/memos, use hook (~500 lines final) |

---

## Rollback Strategy

Each sub-step is small. If anything breaks:
1. `git stash` or revert specific file
2. Hook file can be deleted without affecting page.tsx until it's imported
3. Commit after each successful sub-step to enable precise rollback

---

## Success Criteria

- [ ] `npm run build` passes
- [ ] Both brew modes work end-to-end
- [ ] Browser back button works in all phases
- [ ] Mode switching resets state correctly
- [ ] No console errors
- [ ] page.tsx reduced to ~500 lines (rendering + async execution only)
