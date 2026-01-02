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
