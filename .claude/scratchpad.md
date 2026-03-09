# Refactor & Clean — Session Context

## What Was Done (2026-03-08, session 7)

### Session 7: Verification Suite Generated
- Ran `/verify` against `tasks.md` — produced `__verify__/` with 25 automated tests, 5 checkpoints, task binding
- All 25 tests confirmed to **fail** pre-implementation (correct behavior)
- Updated verify skill mid-session to include Step 5 (task binding) — regenerated `task_map.json`, injected `**Verify**` lines and enforcement header into `tasks.md`
- Split 2 combined tests (`t014` → `t014`+`t015`, `t032_t033` → `t032`+`t033`) to satisfy 1:1 task-to-test rule
- Fixed 2 doc tests (`t032`, `t035`) that were passing pre-implementation — replaced generic identifier checks with tests for "element pools" in docs and QUICKREF legacy gotcha

### Previous Sessions (3-6): Specification & Planning
- Full spec, plan, research, quickstart, checklist, constitution — all complete
- All masterplan assumptions verified (line counts, import chains, dead code consumers)
- Task file generated: 35 tasks across 6 phases

## Current State

- **Branch:** `knights-of-belyar`
- **Feature:** `001-refactor-and-clean`
- **Phase:** Ready to implement — tasks + verification suite both complete
- **Git status:** 30+ dirty files (meta/docs changes, no code changes) + speckit files + `__verify__/` (untracked)
- **No code has been modified yet**

## Key Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Tasks (with verify bindings) | `.specify/specs/001-refactor-and-clean/tasks.md` | **Complete — 35 tasks, verify injected** |
| Verification suite | `__verify__/` | **Complete — 25 tests, 5 checkpoints, task_map.json** |
| Masterplan (detailed steps) | `.claude/masterplan.md` | Complete |
| Spec (requirements) | `.specify/specs/001-refactor-and-clean/spec.md` | Complete |
| Implementation plan | `.specify/specs/001-refactor-and-clean/plan.md` | Complete |
| Research (verified assumptions) | `.specify/specs/001-refactor-and-clean/research.md` | Complete |
| Constitution | `.specify/memory/constitution.md` | Complete |

## Verification Suite Structure

```
__verify__/
├── tests/              # 25 tests (1:1 with automatable tasks)
├── checkpoint_1-5.sh   # Integration gates between phases
├── task_map.json       # Task→test binding
└── run_all.sh          # Master runner (stops on first failure)
```

**6 manual-only tasks:** T001, T002 (git ops), T007 (build check), T013 (commit), T016 (audit judgment), T034 (scratchpad content)

**Checkpoints:** Each runs `npm run build` + phase-specific assertions. Checkpoints 3 & 4 flag manual smoke tests.

## Next Steps

1. **Start implementation** — run `/speckit.implement` or manually execute from tasks.md
2. **Phase 1 (T001-T002):** Commit accumulated `.claude/` and docs clutter to clean the tree
3. **Phase 2 (T003-T013):** Dead code removal (~1,200 lines) — highest value, lowest risk
4. **Phase 3 (T014-T017):** Type consolidation (`CharacterArmorData` in 3 places → 1)
5. **Phases 4+5 (T018-T029):** Page extractions — forage (713→~250) and wizard (1104→~300), parallelizable
6. **Phase 6 (T030-T035):** Documentation sync

### Critical Constraints
- Steps T006 must be **atomic** (recipes.ts + deprecated hooks removed together)
- `npm run build` after every phase (enforced by checkpoints)
- Manual smoke test after page extractions (Phase 4 & 5)
- **Verification tests are immutable** — executor must not modify them

## Verified File State (all match plan expectations)

| File | Current | Target |
|------|---------|--------|
| `src/lib/inventory.ts` | 313 lines | DELETE |
| `src/lib/recipes.ts` | 221 lines | DELETE |
| `src/lib/brewing.ts` | 388 lines | ~140 lines |
| `src/lib/hooks/queries.ts` | 753 lines | ~550 lines |
| `src/lib/db/characterInventory.ts` | 579 lines | ~375 lines |
| `src/app/forage/page.tsx` | 713 lines | ~250 lines |
| `src/app/create-character/page.tsx` | 1,104 lines | ~300 lines |
| `CharacterArmorData` definitions | 3 files | 1 file (`src/lib/types.ts`) |

## Key Decisions Made

1. `CharacterArmorData` canonical location → `src/lib/types.ts` (widest definition with `properties` + `notes`)
2. Wizard steps → 3 themed files (identity/build/final), not 10 individual files
3. Deprecated prefetches removed entirely (filled wrong caches — zero behavior change)

## Established Patterns

- **Extraction model:** `src/components/<feature>/` with types.ts, barrel index.ts
- **Hook model:** `src/lib/hooks/use<Feature>State.ts` for complex state
- **page.tsx role after extraction:** auth guards, data fetching, async mutations, orchestration/render
