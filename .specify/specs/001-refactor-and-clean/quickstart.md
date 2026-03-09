# Quickstart: 001-refactor-and-clean

## TL;DR
Delete ~1,200 lines of dead code, consolidate 1 duplicated type, extract 2 monolithic pages into components, update docs. No behavior changes.

## Execution Order
```
Phase 0 → Phase 1 (steps 1.2+1.3 atomic) → Phase 2 → Phase 3 → Phase 4
```

## Critical Rules
- `npm run build` after EVERY phase
- Manual smoke test after Phase 3 steps (forage, create-character)
- Steps 1.2 and 1.3 MUST be done together (recipes.ts consumers are in deprecated hooks)
- Use `import type` when importing types only

## Key Decisions
1. `CharacterArmorData` canonical location → `src/lib/types.ts` (widest definition, with `properties` + `notes`)
2. Wizard steps grouped into 3 themed files, not 10 individual files (CLAUDE.md: no helpers for one-time operations)
3. Deprecated prefetches removed entirely (they filled wrong caches — net zero behavior change)

## File Quick Reference

### Files to DELETE
- `src/lib/inventory.ts` (313 lines)
- `src/lib/recipes.ts` (221 lines)

### Files to SLIM
- `src/lib/brewing.ts` (388 → ~140 lines) — keep only: `PairedEffect`, `findRecipeForPair`, `canCombineEffects`, `parseTemplateVariables`, `fillTemplate`, `computeBrewedDescription`
- `src/lib/hooks/queries.ts` (753 → ~550 lines) — remove deprecated hooks, fetchers, prefetches, keys
- `src/lib/db/characterInventory.ts` (579 → ~375 lines) — remove 4 Clean functions

### Files to CREATE
- `src/components/forage/{types,BiomeCard,SetupPhase,ResultsPhase,index}.ts(x)`
- `src/components/character/wizard/{types,IdentitySteps,BuildSteps,FinalSteps,index}.ts(x)`

### Files to FIX
- `src/components/brew/HerbSelector.tsx` line 8: `@/lib/inventory` → `./types`
- `src/components/PrefetchLink.tsx`: remove legacy prefetch types
- `src/app/page.tsx`: remove legacy prefetch calls

## Verification Commands
```bash
npm run build                              # Must pass after every phase
grep -r "@/lib/inventory" src/             # Should return 0 after step 1.1
grep -r "prefetchInventory" src/           # Should return 0 after step 1.4
grep -r "type CharacterArmorData =" src/   # Should return exactly 1 after phase 2
```
