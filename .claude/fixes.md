# Phase 3: Inventory Page Refactor Plan

## Goal
Extract `src/app/inventory/page.tsx` (2333 lines) into modular components, reducing it to ~150-200 lines of orchestration code.

## Progress

| Batch | Status | Lines Removed | page.tsx After |
|-------|--------|---------------|----------------|
| Batch 1: Types + Modals | COMPLETE | ~878 lines | 1455 lines |
| Batch 2: Equipment | Pending | - | - |
| Batch 3: Herbalism | Pending | - | - |

## Current State (After Batch 1)
- page.tsx: 1455 lines (down from 2333)
- Types and helper functions extracted to `types.ts`
- AddWeaponModal and AddItemModal extracted to `modals/`
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

## Batch 2: Equipment Components (~520 lines)

### Step 2.1: Extract WeaponCard
**From:** page.tsx lines 460-548
**To:** `src/components/inventory/equipment/WeaponCard.tsx`

Self-contained card component. Receives weapon data + handlers via props.

### Step 2.2: Extract ItemCard
**From:** page.tsx lines 704-788
**To:** `src/components/inventory/equipment/ItemCard.tsx`

Same pattern as WeaponCard.

### Step 2.3: Extract WeaponsTab
**From:** page.tsx lines 370-459
**To:** `src/components/inventory/equipment/WeaponsTab.tsx`

Renders list of WeaponCard components. Manages local search state.

**Imports:** WeaponCard from same folder

### Step 2.4: Extract ItemsTab
**From:** page.tsx lines 557-703
**To:** `src/components/inventory/equipment/ItemsTab.tsx`

Same pattern. Renders ItemCard list.

### Step 2.5: Extract EquipmentSection
**From:** page.tsx lines 252-361
**To:** `src/components/inventory/equipment/EquipmentSection.tsx`

Container that switches between WeaponsTab/ItemsTab.

**Imports:** WeaponsTab, ItemsTab from same folder

### Step 2.6: Create equipment barrel export
**File:** `src/components/inventory/equipment/index.ts`

### Step 2.7: Update main index.ts and page.tsx

**Verify:** `npm run build` passes

---

## Batch 3: Herbalism Components (~635 lines)

### Step 3.1: Extract FilterButton
**From:** page.tsx lines 1452-1476
**To:** `src/components/inventory/herbalism/FilterButton.tsx`

Small utility component, used by BrewedTabContent.

### Step 3.2: Extract HerbsTabContent
**From:** page.tsx lines 1149-1335
**To:** `src/components/inventory/herbalism/HerbsTabContent.tsx`

Receives 18 props currently. Will keep prop drilling for now (context extraction is Phase 4 territory).

**Uses:** HerbRow, ElementSummary from parent inventory folder

### Step 3.3: Extract BrewedTabContent
**From:** page.tsx lines 1355-1451
**To:** `src/components/inventory/herbalism/BrewedTabContent.tsx`

**Uses:** BrewedItemCard, FilterButton

### Step 3.4: Extract HerbalismSection
**From:** page.tsx lines 799-1127
**To:** `src/components/inventory/herbalism/HerbalismSection.tsx`

This is the complex one - contains:
- Herb action handlers (handleAddHerb, handleDeleteHerb, handleDeleteAllHerb)
- Brewed item handlers (handleExpendItem, handleExpendAll)
- Search, sort, filter state
- Grouping/filtering logic
- Computed values

All stays together for now. Will render HerbsTabContent/BrewedTabContent.

### Step 3.5: Create herbalism barrel export
**File:** `src/components/inventory/herbalism/index.ts`

### Step 3.6: Update main index.ts and page.tsx

**Verify:** `npm run build` passes

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

After each batch:
- [ ] `npm run build` passes
- [ ] No TypeScript errors
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
