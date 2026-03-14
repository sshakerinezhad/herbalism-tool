# Oil → Balm Rename

**Spec:** `docs/superpowers/specs/2026-03-12-oil-to-balm-rename.md`

## Steps

### Step 1: Database migration
- Create `supabase/migrations/0XX_rename_oil_to_balm.sql`
  - UPDATE `recipes` and `character_brewed` type column: `'oil'` → `'balm'`
  - DROP + ADD CHECK constraint `character_brewed_type_check` with `'balm'`
  - Replace `brew_items` function body with `'balm'` validation
  - Update SQL comments
- Run `npx supabase db push` then `npm run db:types`

### Step 2: TypeScript types & constants
- `src/lib/types.ts:331` — union `'oil'` → `'balm'`
- `src/lib/constants.ts:146` — `RECIPE_TYPES` array `'oil'` → `'balm'`
- `src/components/inventory/types.ts:12` — `BrewedTypeFilter` union `'oil'` → `'balm'`

### Step 3: Style & icon mappings (4 files)
- `src/components/inventory/BrewedItemCard.tsx:33` — key `oil` → `balm`, icon → `'🩸'`
- `src/components/recipes/RecipeCard.tsx:30` — key `oil` → `balm`
- `src/components/character/QuickSlotCell.tsx:37` — `oil: '🫗'` → `balm: '🩸'`
- `src/components/inventory/herbalism/AddElixirModal.tsx:114` — `oil: '🫗'` → `balm: '🩸'`

### Step 4: UI labels & display strings (3 files)
- `src/components/brew/RecipeSelector.tsx:37,88-89` — `oilRecipes` → `balmRecipes`, title/icon
- `src/components/inventory/herbalism/BrewedTabContent.tsx:84-86` — filter + label
- `src/components/profile/JournalPanel.tsx:18,24,39-43,95` — tab, description, filter

### Step 5: Type assertions & function params (2 files)
- `src/app/(app)/brew/page.tsx:155,208` — two `as` casts
- `src/lib/db/characterInventory.ts:149,208` — two param types

### Step 6: Comments/prose
- `src/app/(app)/brew/page.tsx:6`, `characterInventory.ts:9`, `BrewedItemCard.tsx:2`

### Step 7: Update wave2.md
- Mark "oil → balm" as implemented in kickoff decision table

## Verification
```bash
npm run build
```
Build catches all remaining type mismatches from the union change.
