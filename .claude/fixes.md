# Phase 3: Remaining Page Refactoring Plan

## Progress

**✓ Batch 1 Complete:** Brew Page UI Extraction (956 → 813 lines, 143 lines extracted)

## Overview

Continue the modular extraction pattern from the inventory refactor (2333→195 lines, 91.6% reduction) to the remaining pages.

| Page | Current | Target | Reduction | Status |
|------|---------|--------|-----------|--------|
| Brew | 813 | ~450 | 53% | Batch 1 ✓ |
| Create Character | 1,105 | ~350 | 68% | Pending |
| Edit Character | 637 | ~250 | 61% | Pending |
| Forage | 714 | ~200 | 72% | Pending |

## Execution Order

**Brew → Shared Components → Create → Edit → Forage**

1. **Brew** - Most complex, tackle while context is fresh
2. **Character shared components** - StatsGrid, CurrencyInputs, SkillSelector
3. **Create Character** - Uses shared components
4. **Edit Character** - Benefits from shared components
5. **Forage** - Simplest, clear structure (deferred)

---

## Batch 1: Brew Page UI Extraction ✓ COMPLETED

**Result:** 956 → 813 lines (143 lines extracted)

**Created files:**
```
src/components/brew/
├── index.ts           # Updated exports
├── types.ts           # NEW: BrewMode, BrewPhase, SelectedRecipe, InventoryItem
├── RecipeRequirements.tsx  # NEW: ~110 lines (moved from inline)
└── ModeToggle.tsx     # NEW: ~33 lines (by-herbs/by-recipe toggle)
```

**Completed steps:**
1. ✓ Created `types.ts` with brew-specific types (lines 48-77)
2. ✓ Extracted `RecipeRequirements` component (lines 856-956)
3. ✓ Extracted `ModeToggle` component (lines 635-654)
4. ✓ Updated barrel export, updated page imports
5. ✓ Verified: `npm run build` - passes

---

## Batch 2: Brew Page Hook Extraction (~300 lines extracted) - CAREFUL

**Target:** ~750 → ~450 lines

**APPROACH: Isolate and test thoroughly**

This is the highest-risk extraction. Do it in sub-steps:

**Step 2a: Create hook shell with type exports only**
```
src/lib/hooks/useBrewState.ts
```
- Define return type interface first
- Export hook that just wraps existing inline state (no logic move yet)
- Verify build passes

**Step 2b: Move useState declarations**
- Move all 8 useState calls into hook
- Page imports state from hook
- Verify: `npm run build` + test both brew modes manually

**Step 2c: Move useMemo computations**
- Move all 11 useMemo hooks into useBrewState
- These derive from the state moved in 2b
- Verify: `npm run build` + test element pairing, recipe selection

**Step 2d: Move browser history integration**
- Move popstate listener and history push/replace logic
- Verify: `npm run build` + test browser back button in both modes

**What hook consolidates:**
- 8 useState: brewMode, phase, selectedHerbQuantities, assignedPairs, choices, selectedRecipes, batchCount, mutationError
- 11 useMemo: selectedHerbs, totalHerbsSelected, elementPool, remainingElements, pairedEffects, pairingValidation, requiredChoices, requiredElements, matchingHerbs, herbsSatisfyRecipes, recipes
- Browser history: handleBrowserBack, popstate listener

**Testing checklist after each sub-step:**
- [ ] By-herbs mode: select herbs → pair elements → choices → brew → result
- [ ] By-recipe mode: select recipes → select herbs → choices → brew → batch result
- [ ] Browser back button works in both modes
- [ ] Mode switching resets state correctly

---

## Batch 3: Character Shared Components (~250 lines)

**Target:** Create reusable components before page refactors

**New structure:**
```
src/components/character/forms/
├── index.ts
├── types.ts           # Shared form types
├── StatsGrid.tsx      # ~80 lines (6-stat + honor grid)
├── CurrencyInputs.tsx # ~60 lines (4-currency coin input)
└── SkillSelector.tsx  # ~100 lines (skill proficiency grid)
```

**Steps:**
1. Extract `StatsGrid` from create-character StepStats
2. Extract `CurrencyInputs` from create-character StepEquipment
3. Extract `SkillSelector` from create-character StepSkills
4. Create barrel exports
5. Verify: `npm run build` (no functional changes yet)

---

## Batch 4: Create Character Step Extraction (~600 lines)

**Target:** 1,105 → ~350 lines

**New structure:**
```
src/components/character/wizard/
├── index.ts
├── types.ts           # WizardStep, WizardData, StepProps
├── WizardProgress.tsx # Progress bar
├── WizardNav.tsx      # Back/Next/Create buttons
├── StepName.tsx
├── StepRace.tsx
├── StepBackground.tsx
├── StepClass.tsx
├── StepOrder.tsx
├── StepStats.tsx      # Uses shared StatsGrid
├── StepSkills.tsx     # Uses shared SkillSelector
├── StepVocation.tsx
├── StepEquipment.tsx
└── StepReview.tsx
```

**Steps:**
1. Create `types.ts` with wizard types + STEPS constant
2. Extract each step component (10 total)
3. Extract `WizardProgress` and `WizardNav`
4. Create barrel export, update page imports
5. Verify: `npm run build`

**page.tsx keeps:** Auth, validation logic, submission, step routing

---

## Batch 5: Edit Character Section Extraction (~300 lines)

**Target:** 637 → ~250 lines

**New structure:**
```
src/components/character/edit/
├── index.ts
├── BasicInfoSection.tsx   # Name, appearance, level
├── StatsSection.tsx       # Uses shared StatsGrid
├── HPSection.tsx          # Current/max HP
├── MoneySection.tsx       # Uses shared CurrencyInputs
├── ArmorSection.tsx       # Per-slot armor selection (~100 lines)
└── FixedInfoSection.tsx   # Read-only race/class/background
```

**Steps:**
1. Extract each section component
2. Integrate shared components (StatsGrid, CurrencyInputs)
3. Create barrel export, update page imports
4. Verify: `npm run build`

**page.tsx keeps:** Data loading, save logic, armor immediate saves

---

## Batch 6: Forage Page (~350 lines extracted)

**Target:** 714 → ~200 lines

**New structure:**
```
src/components/forage/
├── index.ts
├── types.ts           # ForagedHerb, SetupPhaseProps, ResultsPhaseProps
├── SetupPhase.tsx     # ~170 lines (biome allocation UI)
├── ResultsPhase.tsx   # ~170 lines (results display, herb removal)
└── BiomeCard.tsx      # ~50 lines (single biome allocation card)
```

**Steps:**
1. Create `types.ts` with extracted types
2. Extract `SetupPhase` component (lines 371-541)
3. Extract `ResultsPhase` component (lines 543-713)
4. Extract `BiomeCard` from SetupPhase
5. Create barrel export, update page imports
6. Verify: `npm run build`

**page.tsx keeps:** Auth, data fetching, state management, phase routing

---

## Decisions Made

1. **Execution order:** Start with Brew (most complex, tackle while fresh)
2. **Brew hook extraction:** Yes, but carefully isolated in sub-steps with testing after each
3. **Shared components:** Extract first, then character pages use them

---

## Critical Files

- `src/app/forage/page.tsx` - 714 lines, SetupPhase/ResultsPhase inline
- `src/app/brew/page.tsx` - 813 lines (was 956), needs Batch 2 hook extraction
- `src/app/create-character/page.tsx` - 1,105 lines, 10 wizard steps inline
- `src/app/edit-character/page.tsx` - 637 lines, section-based layout
- `src/components/inventory/` - Pattern to follow (successful extraction model)
- `src/components/brew/` - Pattern in progress (Batch 1 complete)
