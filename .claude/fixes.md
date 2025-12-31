# Cleanup Plan Notes

## Context
- Planning fixes flagged in review: herbalism data split (legacy vs character tables), RLS off for legacy tables, misnamed mutation `useCharacterBrewedItem`, sessionsUsedToday localStorage is global, forage rolling progress display.

## Open decisions
- Should herbalism migrate to character-based tables?
  - Option A: Migrate forage/brew to `character_*` tables and move data.
  - Option B: Surface both legacy + character inventory (short-term, messy).
  - Option C: Keep legacy short-term and add a migration script or one-time backfill.

## Plan Draft
1. Decide target data model + migration strategy for herbalism.
2. Add RLS policies for legacy tables or finish migration and deprecate legacy tables.
3. Rename `useCharacterBrewedItem` -> `consumeCharacterBrewedItem` (update imports/usages), verify lint.
4. Scope localStorage sessions to user (key includes user id); optionally add date reset if desired.
5. Fix forage rolling progress display and any small UI correctness issues found while touching related code.

## Files likely involved
- src/app/forage/page.tsx
- src/app/brew/page.tsx
- src/app/inventory/page.tsx
- src/lib/inventory.ts
- src/lib/brewing.ts
- src/lib/db/characterInventory.ts
- src/lib/hooks/queries.ts
- src/lib/profile.tsx
- supabase/migrations/* (RLS policies)

## Notes
- Inventory page uses character_* tables; forage/brew still use legacy user_* tables. This is the main inconsistency.
- RLS is documented as off for legacy tables; needs plan before production.

## Decision
- Choose Option 1: migrate herbalism to character_* tables.

## Next questions
- Migrate existing legacy data? If yes, define mapping from user_id -> character_id (likely first character per user).
- Should foraging/brewing be blocked if character is missing? (Inventory page already requires character.)
- Should we keep legacy tables read-only or fully deprecate after migration?

## Immediate work items
- Update forage to use character_herbs and character id.
- Update brew to use character_herbs and character_brewed + character_recipes.
- Update hooks/queries as needed; remove legacy usage from pages.
- Add migration/backfill script (optional but recommended) to move user_* data to character_*.
- Add RLS policies for legacy tables only if they remain in use.

## Decisions (2025-12-30)
- Migrate legacy user_* data into character_* tables.
- Assumption: 1 character per user (for now). Map legacy rows to that character.
- Block forage/brew/inventory if no character; show CTA to create character.
- Note: If multi-character arrives later, we can add a character selector and re-scope herbalism tables by character_id.

## Migration approach (best practice)
- Use a SQL migration in `supabase/migrations/` to backfill legacy user_* herbalism data into character_* tables.
- Keep it idempotent and safe (skip if already migrated), and document it.

## Docs to update
- README.md (remove legacy references + update data flow)
- docs/ARCHITECTURE.md (herbalism data layer now character-based)
- docs/QUICKREF.md (hooks + tables, remove legacy usage in forage/brew)
- docs/CONTRIBUTING.md (patterns: always character_*; update “common tasks”)
- CLAUDE.md (gotchas: legacy now deprecated; use character_* for herbalism)

# Execution Plan (Ready to Go)

## Scope
- Migrate herbalism from legacy user_* tables to character_* tables.
- Gate forage/brew/inventory on character existence.
- Rename misleading mutation `useCharacterBrewedItem`.
- Scope foraging sessions to user in localStorage.
- Update docs to reflect new architecture.

## Data Migration (SQL)
- Create a new Supabase migration file (idempotent):
  - Map legacy user_id -> character_id (single character per user).
  - Backfill `character_herbs` from `user_inventory`.
  - Backfill `character_brewed` from `user_brewed`.
  - Backfill `character_recipes` from `user_recipes`.
  - Use upserts or conflict handling to avoid duplicate inserts on reruns.
  - Optionally mark legacy rows as migrated if a column exists (if not, rely on upsert/unique constraints).
- Decide whether to delete legacy rows after migration (recommended only after validation).

## App Code Changes
1) Forage page
   - Use `useCharacter(userId)`; if no character, show CTA + block.
   - Replace legacy add/remove inventory calls with `character_herbs` operations.
2) Brew page
   - Use character-level herbs and recipes; save to `character_brewed`.
   - Gate when no character.
3) Inventory page
   - Already character-based; add explicit no-character CTA (like profile) if desired.
4) Rename mutation
   - `useCharacterBrewedItem` -> `consumeCharacterBrewedItem` in `src/lib/db/characterInventory.ts` and all callers.
5) Sessions localStorage
   - Key should include user id (e.g., `herbalism-sessions-used:${userId}`).

## Documentation Updates
- README.md: update architecture/data flow; remove legacy references for herbalism.
- docs/ARCHITECTURE.md: character-based herbalism data layer.
- docs/QUICKREF.md: update tables/hooks for forage/brew.
- docs/CONTRIBUTING.md: note character_* usage for herbalism data ops.
- CLAUDE.md: gotchas updated to reflect new reality.

## Test/Verification Plan
- Manual:
  - User without character: forage/brew/inventory blocked with CTA.
  - Forage adds herbs -> inventory shows in herbalism tab (character tables).
  - Brew consumes herbs, creates character_brewed item -> inventory shows brewed item.
- Optional lint pass (if desired): ensure no hook naming violations.

## Open Questions (If Needed Later)
- Whether to delete legacy rows post-migration or keep read-only.
- If multi-character arrives, add character selector and scope herbalism by character_id.

---

# Execution Log - 2025-12-31

## Codebase Exploration Complete

**Key Finding: SQL migration already exists!**
Migration `008_unified_character_inventory.sql` already handles:
- Creating `character_herbs`, `character_brewed`, `character_recipes` tables
- Migrating data from `user_inventory`, `user_brewed`, `user_recipes`
- RLS policies for new tables

**Current State Summary:**
| Component | Status | Details |
|-----------|--------|---------|
| SQL Migration | DONE | 008_unified_character_inventory.sql |
| Inventory page | DONE | Uses `useCharacterHerbs`, `useCharacterBrewedItems` |
| Forage page | NEEDS UPDATE | Still uses legacy `addHerbsToInventory`, `removeHerbsFromInventory` |
| Brew page | NEEDS UPDATE | Still uses legacy `useInventory`, `useUserRecipesForBrewing`, `saveBrewedItem` |
| localStorage sessions | NEEDS UPDATE | Global key `herbalism-sessions-used` in profile.tsx:33 |
| Mutation rename | NEEDS UPDATE | `useCharacterBrewedItem` → `consumeCharacterBrewedItem` in characterInventory.ts:186 |

**Files to Modify:**

1. `src/app/forage/page.tsx`:
   - Import `useCharacter` from hooks
   - Import `addCharacterHerbs`, `removeCharacterHerbs` from characterInventory
   - Add character gate (no-character CTA)
   - Replace legacy inventory calls with character-based ones
   - Update cache invalidation to `invalidateCharacterHerbs(characterId)`

2. `src/app/brew/page.tsx`:
   - Import character hooks and functions
   - Add character gate
   - Replace legacy hooks/functions with character-based equivalents

3. `src/lib/profile.tsx`:
   - Line 33: Include userId in localStorage key

4. `src/lib/db/characterInventory.ts`:
   - Line 186: Rename `useCharacterBrewedItem` → `consumeCharacterBrewedItem`

5. `src/app/inventory/page.tsx`:
   - Update import for renamed function

## Implementation Complete - 2025-12-31

### Changes Made

**1. Forage page (`src/app/forage/page.tsx`):**
- Added `useAuth`, `useCharacter` hooks
- Replaced `addHerbsToInventory` → `addCharacterHerbs` (from characterInventory.ts)
- Replaced `removeHerbsFromInventory` → `removeCharacterHerbs`
- Replaced `invalidateInventory` → `invalidateCharacterHerbs`
- Added character gate (shows CTA if no character exists)

**2. Brew page (`src/app/brew/page.tsx`):**
- Added `useAuth`, `useCharacter`, `useCharacterHerbs`, `useCharacterRecipesNew` hooks
- Created `InventoryItem` type alias for CharacterHerb compatibility
- Replaced legacy hooks with character-based equivalents
- Replaced `saveBrewedItem` → `addCharacterBrewedItem`
- Replaced `removeHerbsFromInventory` → `removeCharacterHerbs`
- Updated cache invalidation to use character-based functions
- Added character gate

**3. Types (`src/lib/types.ts`):**
- Added `recipes?: Recipe` to CharacterRecipe type for join compatibility

**4. Mutation rename (`src/lib/db/characterInventory.ts`):**
- Renamed `useCharacterBrewedItem` → `consumeCharacterBrewedItem`
- Updated all callers in inventory page

**5. localStorage sessions (`src/lib/profile.tsx`):**
- Changed `SESSIONS_KEY` to `SESSIONS_KEY_PREFIX`
- Added `getSessionsKey(userId)` function
- Sessions now stored as `herbalism-sessions-used:${userId}`

**6. Documentation updates:**
- `CLAUDE.md` - Updated gotchas for character-based herbalism
- `docs/QUICKREF.md` - Updated tables, hooks, gotchas sections
- `docs/ARCHITECTURE.md` - Updated session tracking, brewing, recipe sections
- `docs/CONTRIBUTING.md` - Updated database operations examples

### Build Status
All changes compile successfully with `npm run build`.

### What's Left (if needed)
- Manual testing of forage/brew flows
- Optional: Delete legacy `src/lib/inventory.ts` and related code if no longer used
- Optional: Drop legacy tables in a future migration after validation

# Current Ordered TODOs (Post-Review)

## 1) Data Migration + Recipe Seeding
1. Add a backfill SQL migration (if not already applied in env):
   - Map each `user_id` to its single `character_id`.
   - `user_inventory` -> `character_herbs` (sum quantities per herb).
   - `user_brewed` -> `character_brewed` (type, effects, choices, computed_description, quantity).
   - `user_recipes` -> `character_recipes`.
   - Make idempotent via `ON CONFLICT DO NOTHING`.
2. Seed base recipes for new characters (character-based):
   - Add `initializeBaseCharacterRecipes(characterId)`.
   - Call it inside `createCharacter` (after character insert).
   - Stop calling legacy `initializeBaseRecipes(userId)` from profile creation.

## 2) Gating + Auth
3. Brew herbalist gate should check `character.vocation === 'herbalist'` (not `profile.isHerbalist`).
4. Forage/Brew should redirect to `/login` when unauthenticated (consistent with other pages).
5. Enforce a full-page “no character” CTA on Inventory (currently only equipment section handles this).

## 3) Error Handling + Cleanup
6. Brew should abort if herb removal fails (don’t continue to save brewed items).
7. Remove unused `profileId` in forage/brew to avoid lint warnings.
8. Ensure `character_recipes` joins are handled consistently (typing + null safety).

## 4) Documentation Alignment
9. Update docs only after code changes are correct:
   - README.md
   - docs/ARCHITECTURE.md
   - docs/QUICKREF.md
   - docs/CONTRIBUTING.md
   - CLAUDE.md
   Ensure claims about RLS + deprecated tables match actual state.

## 5) Verification
10. Manual checks:
   - No character: forage/brew/inventory blocked with CTA.
   - With character: forage adds `character_herbs`; brew consumes herbs + adds `character_brewed`.
   - New characters have base recipes in `character_recipes`.
   - Legacy data appears after migration.
