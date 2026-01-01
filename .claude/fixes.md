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
