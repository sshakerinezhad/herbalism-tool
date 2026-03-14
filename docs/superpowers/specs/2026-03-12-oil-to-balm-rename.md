# Oil → Balm Rename

**Wave:** 2B (Herbalism & Inventory) — first chunk
**Decision source:** Kickoff brainstorm decision #1 — rename "oil" to "balm" to match EPG terminology
**Approach:** Big bang — single commit with DB migration + all code changes

## Scope

Rename the recipe type `'oil'` to `'balm'` across the entire stack: database, TypeScript types, constants, UI labels, style mappings, and icons.

**Icon change:** 🫗/⚔️/🗡️ → 🩸 (drop of blood) everywhere balm appears
**Color scheme:** Stays amber — balms are weapon coatings, amber fits the fantasy

## Changes by Layer

### 1. Database Migration (new file: `supabase/migrations/0XX_rename_oil_to_balm.sql`)

- `UPDATE recipes SET type = 'balm' WHERE type = 'oil'`
- `UPDATE character_brewed SET type = 'balm' WHERE type = 'oil'`
- `ALTER TABLE character_brewed DROP CONSTRAINT character_brewed_type_check, ADD CONSTRAINT character_brewed_type_check CHECK (type IN ('elixir', 'bomb', 'balm'))`
- Replace `brew_items` RPC function body — change `'oil'` validation to `'balm'`
- Update SQL comments

### 2. TypeScript Types & Constants

| File | Change |
|------|--------|
| `src/lib/types.ts:331` | `'elixir' \| 'bomb' \| 'oil'` → `'elixir' \| 'bomb' \| 'balm'` |
| `src/lib/constants.ts:146` | `RECIPE_TYPES` array: `'oil'` → `'balm'` |
| `src/components/inventory/types.ts:12` | `BrewedTypeFilter` union: `'oil'` → `'balm'` |
| `src/lib/database.types.ts` | Regenerate with `npm run db:types` |

### 3. Style & Icon Mappings

| File | Change |
|------|--------|
| `src/components/inventory/BrewedItemCard.tsx:33-38` | `oil: {...}` → `balm: {...}`, icon: `'🩸'` |
| `src/components/recipes/RecipeCard.tsx:30-36` | `oil: {...}` → `balm: {...}` |
| `src/components/character/QuickSlotCell.tsx:37` | `oil: '🫗'` → `balm: '🩸'` |
| `src/components/inventory/herbalism/AddElixirModal.tsx:114` | `oil: '🫗'` → `balm: '🩸'` |

### 4. UI Labels & Display Strings

| File | Change |
|------|--------|
| `src/components/brew/RecipeSelector.tsx:37,88-89` | `oilRecipes` → `balmRecipes`, title `"Oils"` → `"Balms"`, icon `"🗡️"` → `"🩸"` |
| `src/components/inventory/herbalism/BrewedTabContent.tsx:84-86` | Filter checks + label `"Oils"` → `"Balms"`, icon → `🩸` |
| `src/components/profile/JournalPanel.tsx:18,24,39-43,95` | ViewTab type, tab definition, description text, filter — all `oil` → `balm`, `"Oils"` → `"Balms"`, `"Oils are applied to weapons..."` → `"Balms are applied to weapons..."` |

### 5. Type Checks & Assertions

| File | Change |
|------|--------|
| `src/app/(app)/brew/page.tsx:155,208` | Two `as 'elixir' \| 'bomb' \| 'oil'` → `as 'elixir' \| 'bomb' \| 'balm'` |
| `src/lib/db/characterInventory.ts:149,208` | Two function parameter type unions |

### 6. Comments/Prose (low priority, consistency)

- `src/app/(app)/brew/page.tsx:6` — docstring
- `src/lib/db/characterInventory.ts:9` — file header
- `src/components/inventory/BrewedItemCard.tsx:2` — component docstring

## Not Changing

- **Existing migration files** (005, 008, 009) — already applied to DB
- **Amber color palette** — still appropriate for weapon-coating balms
- **`herbalism/page.tsx` ternary** — the `else` fallback already handles non-elixir/non-bomb types correctly
- **Recipe `description` or `recipe_text` content** in the database — these are specific to each recipe and don't use the word "oil" generically

## Verification

```bash
npx supabase db push && npm run db:types && npm run build
```

All three must pass. Build catches any remaining type mismatches from the union change.
