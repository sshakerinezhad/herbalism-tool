# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-10

## What was done

### Group A (Tasks 1-2) ✅ Checkpoint A passed
- Task 1: Created `src/lib/characterUtils.ts` — 4 pure functions
- Task 2: Fixed brew error message → "Cannot mix multiple types in one brew"

### Group B (Tasks 3-6) ✅ Checkpoint B passed
- Tasks 3-6: Migrated all modifiers from stored Profile fields to computed values. Profile type stripped to `{ name: string }`.

### User testing of Group B
User manually tested and found 4 issues. All triaged — **no regressions from Group B:**

| # | Issue | Verdict |
|---|-------|---------|
| 1 | Ability score edits don't persist to character page | Pre-existing — **Task 12** fixes (cache invalidation after save) |
| 2 | Brewing "no effects selected" after pairing | **Not a bug** — test user 4 has no learned recipes. |
| 3 | Brewing modifier +3 with INT +1 | Math correct (INT +1 + prof +2). Should eventually check Herbalist Tools proficiency, not vocation. **Defer.** |
| 4 | INT changes in edit don't update character page | Same as #1 — **Task 12** |

### Group C (Tasks 7-10) ✅ Checkpoint C passed
- Task 7: Added vocation editing to edit-character page (`CharacterUpdate` type + dropdown in Basic Info, removed vocation from fixed identity section)
- Task 8: Fixed PairingPhase to use index-based selection (fixes duplicate element bug, added useEffect reset)
- Task 9: Added optimistic cache updates for herb deletion (queryClient.setQueryData for both single and delete-all)
- Task 10: Created AddHerbModal — `fetchAllHerbs()` in characterInventory.ts, `useAllHerbs()` hook in queries.ts, searchable modal with quantity selector, exported from barrel, integrated into HerbalismSection with "+ Add Herbs" button

### Group D (Tasks 11-14) ✅ Checkpoint D passed
- Task 11: Added RACES, CLASSES, BACKGROUNDS, KNIGHT_ORDERS imports — identity section now shows "High Elf" instead of "high_elf"
- Task 12: Replaced `saveSuccess` banner with `invalidateCharacter()` + `router.push('/profile')` — edit→save navigates back to profile
- Task 13: Added `useInvalidateQueries` to create-character — cache invalidated before redirect (fixes "Create Your Knight" flash)
- Task 14: Added `adjustHpForMaxChange` helper + CON-specific branch in `updateStat` + `updateHpCustomModifier` handler (CON up → fill to max, CON down → cap if above)

### Group E (Tasks 15-18) ✅ Checkpoint E passed
- Task 15: Created `011_weapon_self_contained.sql` — adds `range_normal`, `range_long`, `versatile_dice` columns + backfill from templates. Manually updated `database.types.ts` (Supabase not linked locally — `db:push` deferred to deploy)
- Task 16: Changed `CharacterWeapon.properties` from `Record<string, unknown>` to `string[]`, added range/versatile fields to type. Fixed `addWeaponFromTemplate` to copy all template data. Added `updateCharacterWeapon()`. Fixed `ItemTooltip` to render both `string[]` (weapons) and `Record` (armor) properties. Fixed `WeaponSlotCard` cast.
- Task 17: `WeaponCard` now reads `weapon.properties` directly (not `weapon.template?.properties`), shows range display, has edit button with `onEdit` prop. Added range helper text to `AddWeaponModal`.
- Task 18: Created `EditWeaponModal` — pre-filled form for all weapon fields, comma-separated properties editing, calls `updateCharacterWeapon()`. Exported from barrel. Wired into `WeaponsTab` with `editingWeapon` state.

### Post-Wave 1 Fix Session (2026-03-10)
- Linked Supabase project locally (`supabase link`)
- Pushed migration 011 (`db:push`) — `range_normal`, `range_long`, `versatile_dice` columns now live
- Regenerated `database.types.ts` from live schema (replaces manual edits)
- Wired up `versatile_dice` fully: `addCustomWeapon()`, `updateCharacterWeapon()`, `EditWeaponModal`, `AddWeaponModal` custom mode, `WeaponCard` display
- User confirmed weapon adding works

## Current state

- **Wave 1 fully complete and deployed** — all 13 bugs fixed, weapon editing added, migration live
- Build passes cleanly, no type errors

## Key context for next agent

- **Wave 1 is done.** Ready for Wave 2 (design system + system overhauls).
- **Supabase is linked locally** — `db:push` and `db:types` both work
- **Profile type is `{ name: string }`** — all modifiers computed from `characterUtils.ts`
- **Weapons are now self-contained** — template data copied at creation time, no joins needed for display
- **`updateCharacterWeapon()`** exists in `src/lib/db/characters.ts` for editing weapons
- **`ItemTooltip`** handles both `string[]` (weapon properties) and `Record<string, unknown>` (armor properties)
- **Deferred item:** Brewing modifier should eventually check Herbalist Tools proficiency instead of vocation

## Next steps

1. User testing of Groups C-E
2. Brainstorm Wave 2 (design system)
