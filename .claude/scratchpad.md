# Scorched Earth Cleanup — Complete

**Branch:** `knights-of-belyar`
**Feature:** `001-refactor-and-clean`
**Status:** All 6 phases complete (35 tasks across setup, dead code removal, type consolidation, forage extraction, wizard extraction, documentation polish)

## Results Summary

~1,200 lines of dead code removed, ~1,400 lines extracted into focused components. Two deleted modules (`inventory.ts`, `recipes.ts`), deprecated hooks/functions cleaned from `queries.ts`, `brewing.ts`, and `characterInventory.ts`. Two large pages broken into component directories. All documentation updated to reflect current state.

## Current Line Counts (post-cleanup)

| File | Before | After | Change |
|------|--------|-------|--------|
| `src/lib/inventory.ts` | 313 | DELETED | -313 |
| `src/lib/recipes.ts` | 221 | DELETED | -221 |
| `src/lib/brewing.ts` | 388 | 152 | -236 |
| `src/lib/hooks/queries.ts` | 753 | 547 | -206 |
| `src/lib/db/characterInventory.ts` | 579 | 371 | -208 |
| `src/app/forage/page.tsx` | 713 | 363 | -350 (extracted to `src/components/forage/`) |
| `src/app/create-character/page.tsx` | 1,104 | 446 | -658 (extracted to `src/components/character/wizard/`) |

## Extraction Structure

```
src/components/forage/
├── types.ts          # ForagedHerb
├── BiomeCard.tsx     # Biome selection card
├── SetupPhase.tsx    # Biome allocation, session display, start button
├── ResultsPhase.tsx  # Results display, herb cards, add-to-inventory
└── index.ts          # Barrel export

src/components/character/wizard/
├── types.ts          # WizardStep, WizardData, StepProps
├── IdentitySteps.tsx # StepName, StepRace, StepBackground, StepClass, StepOrder
├── BuildSteps.tsx    # StepStats, StepSkills, StepVocation
├── FinalSteps.tsx    # StepEquipment, StepReview
└── index.ts          # Barrel export
```

## Key Decisions Made

1. `CharacterArmorData` canonical location: `src/lib/types.ts` (widest definition with `properties` + `notes`)
2. Wizard steps: 3 themed files (identity/build/final), not 10 individual files
3. Deprecated prefetches removed entirely (filled wrong caches, zero behavior change)

## Established Patterns

- **Extraction model:** `src/components/<feature>/` with `types.ts`, barrel `index.ts`
- **Hook model:** `src/lib/hooks/use<Feature>State.ts` for complex state
- **page.tsx role after extraction:** auth guards, data fetching, async mutations, orchestration/render
