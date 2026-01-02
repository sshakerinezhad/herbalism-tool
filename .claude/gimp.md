# Batch 2: useBrewState Hook Extraction Plan

## Progress Update

**✓ Step 2a COMPLETE** - Hook shell with types established
**✓ Step 2b COMPLETE** - useState declarations moved to hook

**Current status:**
- `src/app/brew/page.tsx`: 813 → **567 lines** (246 lines extracted)
- `src/lib/hooks/useBrewState.ts`: **199 lines** (8 useState + basic actions implemented)
- `npm run build`: ✓ Passing

**What's working:**
- All 8 state variables moved to hook and exposed via return object
- Basic actions implemented: `addPair`, `removePair`, `setChoice`, `setBatchCount`, `switchBrewMode`, `reset`, `setPhase`, `setMutationError`
- Page successfully uses `brewState.actions.*` for all interactions
- Async functions (`executeBrew`, `executeBrewWithEffects`, `proceedToBrewing`) remain in page.tsx as planned

**What's stubbed (Step 2c):**
- 11 useMemo computed values currently return empty/default values
- Actions that depend on computed values: `addHerb`, `removeHerb`, `proceedToPairing`, `proceedToChoices`, `proceedToHerbSelection`, `proceedFromRecipeMode`, `addRecipeSelection`, `removeRecipeSelection`

**Next:** Step 2c - Implement 11 useMemo computations in hook

**Known Issues to Fix (from codex review):**
- **P1 (Regression):** Back-navigation from select-herbs-for-recipes no longer clears selectedHerbQuantities. The original code had `setSelectedHerbQuantities(new Map())` on the back button (old line 703-704), but it was lost during refactor. Need to add back temporarily in page.tsx onClick or add `clearHerbSelections()` action to hook.
- **P3 (Cleanup):** Remove unused `useMemo` import from useBrewState.ts line 12 (it's imported but computed values are still stubbed).
- **P0 (Expected):** Stubbed computed values are intentional - Step 2c will implement them. Don't wire hook fully until Step 2c is complete.

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

### Step 2c: Move useMemo Computations (Medium Risk)

**Goal:** Transfer 11 useMemo hooks into useBrewState.

**Order of migration (respects dependencies):**

**Group 1 - No memo dependencies:**
- `recipes` (depends on: characterRecipes)

**Group 2 - Depend on state + inventory:**
- `selectedHerbs` (depends on: inventory, selectedHerbQuantities)
- `totalHerbsSelected` (depends on: selectedHerbQuantities)
- `elementPool` (depends on: selectedHerbQuantities, inventory)

**Group 3 - Depend on Group 2:**
- `remainingElements` (depends on: elementPool, assignedPairs)
- `pairedEffects` (depends on: assignedPairs, recipes)

**Group 4 - Depend on Group 3:**
- `pairingValidation` (depends on: pairedEffects)
- `requiredChoices` (depends on: pairedEffects)

**Group 5 - Recipe mode (parallel to Group 2-4):**
- `requiredElements` (depends on: selectedRecipes, batchCount)
- `matchingHerbs` (depends on: inventory, requiredElements)
- `herbsSatisfyRecipes` (depends on: selectedHerbQuantities, inventory, requiredElements, selectedRecipes, batchCount)

**Testing after each group:**
- [ ] Element pool displays correctly in SelectedHerbsSummary
- [ ] Pairing validation shows errors when mixing types
- [ ] herbsSatisfyRecipes enables/disables Continue button

**Verify:** `npm run build` passes after each group

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
