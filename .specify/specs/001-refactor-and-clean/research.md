# Research: 001-refactor-and-clean

## Status: Complete
**Date**: 2026-03-08

## Findings

### 1. File State Verification

All masterplan line counts are accurate as of 2026-03-08:

| File | Expected Lines | Actual Lines | Match |
|------|---------------|-------------|-------|
| `src/lib/inventory.ts` | 313 | 313 | YES |
| `src/lib/recipes.ts` | 221 | 221 | YES |
| `src/lib/brewing.ts` | 388 | 388 | YES |
| `src/lib/hooks/queries.ts` | 753 | 753 | YES |
| `src/lib/db/characterInventory.ts` | 579 | 579 | YES |
| `src/components/PrefetchLink.tsx` | 107 | 106 | ~YES (off by 1) |
| `src/app/forage/page.tsx` | 713 | 713 | YES |
| `src/app/create-character/page.tsx` | 1,104 | 1,104 | YES |

### 2. Import Chain Verification

| Import | Expected Consumers | Actual Consumers | Match |
|--------|-------------------|-----------------|-------|
| `@/lib/inventory` | 1 (HerbSelector.tsx) | 1 (HerbSelector.tsx line 8) | YES |
| `@/lib/recipes` (direct) | 0 | 0 | YES |
| `@/lib/recipes` (via queries.ts) | 1 (queries.ts) | 1 (queries.ts) | YES |
| `@/lib/brewing` deprecated exports | 1 (queries.ts line 21) | 1 (queries.ts line 21) | YES |

### 3. CharacterArmorData Type Inconsistency

**Decision**: Use the widest definition (from queries.ts/edit-character) as canonical.
**Rationale**: ArmorDiagram.tsx's narrower definition is missing `properties` and `notes` fields. The component likely doesn't use them, but having a single wider canonical type is harmless (unused fields are ignored) and prevents future confusion.
**Alternatives considered**:
- Separate narrow type for ArmorDiagram → rejected (creates more types, violates "single source of truth" goal)
- Use ArmorDiagram's narrow version → rejected (loses field information)

### 4. Canonical Type Location

**Decision**: Place `CharacterArmorData` in `src/lib/types.ts` (line 461, 461 lines currently).
**Rationale**: This file already contains all shared types (`CharacterArmorPiece`, `ArmorSlot`, etc.). It's the established pattern.
**Alternatives considered**:
- Leave in queries.ts → rejected (types.ts is the canonical location for shared types)
- New types file → rejected (unnecessary, existing file fits perfectly)

### 5. Clean Functions Confirmed Dead

All 4 "Clean" functions in `characterInventory.ts` confirmed zero consumers:
- `fetchCharacterWeaponsClean` (line 382)
- `addCharacterWeaponClean` (line 441)
- `fetchCharacterItemsClean` (line 492)
- `addCharacterItemClean` (line 537)

No file in `src/` imports any of these.

### 6. Prefetch System Analysis

The `usePrefetch()` hook (queries.ts lines 613-709) returns 6 functions:
- `prefetchInventory(profileId)` — DEPRECATED, fills wrong cache
- `prefetchForage()` — ACTIVE, used by PrefetchLink
- `prefetchBrew(profileId)` — DEPRECATED, fills wrong cache
- `prefetchRecipes(profileId)` — DEPRECATED, fills wrong cache
- `prefetchProfile(userId)` — ACTIVE, used by PrefetchLink
- `prefetchCharacterHerbalism(characterId)` — ACTIVE, used by home page

**Decision**: Remove deprecated prefetch functions. Keep `prefetchForage`, `prefetchProfile`, `prefetchCharacterHerbalism`.
**Rationale**: Deprecated prefetches fill user-based caches that no page reads from (pages use character-based hooks). Removing them is net-zero behavior change.

### 7. HerbSelector Import Fix

**Decision**: Change `import { InventoryItem } from '@/lib/inventory'` → `import type { InventoryItem } from './types'`
**Rationale**: The `InventoryItem` type already exists in `src/components/brew/types.ts` (line 11). This was the intended migration path.
**Verification**: Confirmed `InventoryItem` type is defined in `brew/types.ts`.

## No Unresolved Items

All NEEDS CLARIFICATION items resolved. No unknowns remain.
