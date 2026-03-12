# Plan: Bug Fixes + Add Elixir Feature

## 1. Fix Brewing Bug (one-line fix)

**File:** `src/lib/hooks/useBrewState.ts` ~line 380
- **Change:** `count: count * batchCount` → `count: count`
- **Why:** `batchCount` controls how many dice rolls / brew attempts happen. It should NOT multiply the effect potency. The DB layer already uses `batchCount` for repetition (herb removal × batchCount, quantity = successCount).

## 2. Fix CoinPurse Debounce / Race Conditions

**File:** `src/components/character/CoinPurse.tsx`
- Add `pendingCoin: CoinType | null` state to track which coin type has an in-flight mutation
- In `handleChange()`: if `pendingCoin` is set, return early (block concurrent mutations)
- Set `pendingCoin = coinType` before the DB call, clear it after (success or error)
- Pass `disabled={isDisabled || pendingCoin === type}` to each `CoinCell` so buttons gray out during save
- Fix `useEffect` dependency: wrap `propCoins` sync with a guard — skip if any mutation is pending (don't reset optimistic state mid-flight)

## 3. Add Elixir to Inventory (new modal)

**New file:** `src/components/inventory/herbalism/AddElixirModal.tsx`
- Mirrors `AddHerbModal` pattern (same modal structure, search, quantity picker)
- Lists character's unlocked recipes via `useCharacterRecipes()` hook
- User selects a recipe → picks potency (1–4 via button group, default 1) → picks quantity (default 1)
- If recipe has template variables in `description` (e.g. `{damage_type}`), show choice dropdowns (reuse `parseTemplateVariables` from `useBrewState.ts`)
- On submit: build `effects[]` by repeating `recipe.name` × potency, call `addCharacterBrewedItem(characterId, recipe.type, effects, computedDescription, choices, quantity)`
- Compute `computedDescription` by filling template variables into `recipe.description` (reuse `fillTemplate` from brew utils)

**Modified files:**
- `src/components/inventory/herbalism/HerbalismSection.tsx` — add `showAddElixir` state, render `AddElixirModal` when brewed tab is active, add "+ Add Elixir" button next to Brewed tab
- `src/components/inventory/herbalism/index.ts` — export `AddElixirModal`

**Reuses:**
- `addCharacterBrewedItem()` from `src/lib/db/characterInventory.ts` (already exists, untouched)
- `useCharacterRecipes()` from `src/lib/hooks/queries.ts`
- `parseTemplateVariables` and `fillTemplate` from `src/lib/brewing.ts` (already exported)

## Verification

```bash
npm run build
```
Then manual test:
- Brew page: "by recipe" → select 3× single-power healing → should get up to 3 single-potency elixirs
- CoinPurse: rapid-click +1 gold 5 times → should increment exactly 5, no jumps or resets
- Inventory Brewed tab: click "+ Add Elixir" → pick recipe → set potency 2 → add → verify item appears with potency 2
