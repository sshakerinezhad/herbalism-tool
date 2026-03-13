# Scratchpad

**Branch:** `main`
**Last session:** 2026-03-12 (session 13)

## Current state

- On `main`, **uncommitted changes** — ready to commit
- Build passing
- Wave 2 interstitial work complete (see `.claude/wave2.md`)

## Session 13 — what was done

### Task 1: CoinPurse → CharacterBanner
- Rewrote `CoinPurse.tsx` as compact metallic gradient pills (value + label)
- Click pill → **inline expanding edit tray** slides open below pill row (CSS Grid `grid-rows-[0fr]→[1fr]` animation)
- Initial version used a popover, but it got clipped by the banner's `overflow-hidden`. Redesigned to expand inline within DOM flow — no portals, no z-index, no clipping.
- Tray layout: `-100 -10 -1 [value] +1 +10 +100` — symmetric, spacious
- Removed lock toggle and standalone GrimoireCard section from CharacterSheet
- CoinPurse now lives inside CharacterBanner's identity column (below race/background line)
- New CharacterBanner props: `coins`, `characterId`, `onMoneyChanged`

### Task 2: Dynamic Brewing DC
- `BREWING_DC = 15` → `getBrewingDC(herbCount)` = `herbCount * 2 + 6`
- Updated all 3 DC check sites in `brew/page.tsx`
- `dc` added to BrewPhase type, passed to ResultPhase/BatchResultPhase
- Aligns with EPG formula (kickoff brainstorm decision #3, updated in wave2.md)

### Files changed
- `src/components/character/CoinPurse.tsx` — full rewrite (pills + inline tray)
- `src/components/character/CharacterBanner.tsx` — new props, CoinPurse placement
- `src/components/profile/CharacterSheet.tsx` — removed standalone CoinPurse, pass coins to banner
- `src/lib/constants.ts` — `getBrewingDC()` replaces `BREWING_DC` constant
- `src/app/(app)/brew/page.tsx` — dynamic DC at all check sites
- `src/components/brew/ResultPhase.tsx` — `dc` prop on both result components
- `src/components/brew/types.ts` — `dc` field on result/batch-result phases
- `.claude/wave2.md` — updated interstitial section + kickoff decision #3

## What the next session needs to do

1. **Commit** these changes
2. **Manual testing:**
   - Character sheet: coin pills visible in banner below identity text
   - Click pill → edit tray slides open with ±1/±10/±100
   - Click outside → tray closes
   - Rapid-click +1 gold 5 times → increments exactly 5, no race conditions
   - Brew page: DC displays dynamically (2 herbs = DC 10, 4 herbs = DC 14, 6 herbs = DC 18)
   - Result screen: DC number matches herb count used
3. **Next wave piece:** 2B — Herbalism & Inventory (brainstorm first)
