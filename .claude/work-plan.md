# Plan: CoinPurse → Banner + Dynamic Brewing DC

## Task 1: Move CoinPurse into CharacterBanner

**Goal:** Compact coin pills below identity text (right of portrait), click-to-popover for editing.

### Files to modify

- `src/components/character/CoinPurse.tsx` — Refactor into two modes:
  - **Compact mode (new default):** Horizontal row of 4 metallic coin pills (value + label). Each pill is clickable.
  - **Popover:** On click, show a small dropdown with ±1/±10/±100 buttons (reuse existing `Btn` sub-component). Close on click-outside.
  - Remove the lock toggle header — the popover pattern replaces it (coins are read-only until clicked).
  - Keep all existing mutation logic (optimistic updates, pendingCoin guard, error rollback).

- `src/components/character/CharacterBanner.tsx` — Add CoinPurse below identity text:
  - New props: `coins: Coins`, `characterId: string`, `onMoneyChanged: () => void`
  - Place `<CoinPurse>` after the race/background/vocation line, inside the identity `<div>` (right of portrait, won't shift portrait height — portrait is `shrink-0` with fixed size)

- `src/components/profile/CharacterSheet.tsx` — Remove the standalone `<GrimoireCard>` CoinPurse section (lines 336-349). Pass coin props to CharacterBanner instead.

### Reuse
- `updateCharacterMoney` from `src/lib/db/characters.ts` (already used by CoinPurse)
- `useInvalidateQueries` from `src/lib/hooks/queries.ts` (already used in CharacterSheet)
- Existing `COIN_CONFIG`, `Btn`, metallic gradient styles in CoinPurse.tsx

---

## Task 2: Dynamic Brewing DC

**Goal:** Replace hardcoded `BREWING_DC = 15` with `DC = herbCount * 2 + 6`.

### Files to modify

- `src/lib/constants.ts` — Replace `export const BREWING_DC = 15` with:
  ```ts
  export function getBrewingDC(herbCount: number): number {
    return herbCount * 2 + 6
  }
  ```

- `src/app/(app)/brew/page.tsx` — At all 3 DC check sites (lines ~151, ~226, ~261):
  - Compute `const dc = getBrewingDC(totalHerbsSelected)`
  - Replace `total >= BREWING_DC` with `total >= dc`
  - Pass `dc` to ResultPhase / BatchResultPhase

- `src/components/brew/ResultPhase.tsx` — Add `dc: number` prop to both components:
  - `ResultPhase`: Replace hardcoded `≥ 15 (DC)` / `< 15 (DC)` with `≥ ${dc} (DC)` / `< ${dc} (DC)`
  - `BatchResultPhase`: Replace `Roll Results (DC 15)` with `Roll Results (DC ${dc})`

### Reuse
- `totalHerbsSelected` already exported from `useBrewState` hook (line 443)

---

## Verification

```bash
npm run build
```
