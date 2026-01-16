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
