# Scratchpad - 2025-12-31

## Previous Session Summary

Successfully migrated herbalism functionality from legacy user-based tables to character-based tables. Build passes.

**Key learnings:**
- SQL migration `008_unified_character_inventory.sql` already handled table creation and data migration
- Inventory page was already migrated; forage/brew pages were updated
- `useCharacterBrewedItem` renamed to `consumeCharacterBrewedItem`
- localStorage sessions scoped to user: `herbalism-sessions-used:${userId}`

---

## Current Task: Post-Migration Fixes

Issues identified in review that need to be addressed.

### Fix 1: Recipe Initialization for Herbalists ✅ COMPLETED

**Goal:** New herbalist characters automatically receive base recipes; non-herbalists start with empty recipe book.

**Implementation:**
- Added `initializeBaseCharacterRecipes()` to `src/lib/db/characterInventory.ts:264-297`
  - Fetches all non-secret recipes
  - Bulk inserts into `character_recipes`
  - Uses UNIQUE constraint for idempotency
- Updated `src/app/create-character/page.tsx:317-324`
  - Added import for `initializeBaseCharacterRecipes`
  - Calls function conditionally for herbalist vocation
  - Non-fatal error handling (logs but continues)
- Build passes successfully ✅

---

### Fix 2: Auth Redirects for Forage/Brew

**Goal:** Consistent auth handling - redirect to /login if not authenticated.

**Files to modify:**
- `src/app/forage/page.tsx`
- `src/app/brew/page.tsx`

**Implementation:**
Add useEffect in both pages (same pattern as profile/inventory):
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
  }
}, [authLoading, user, router])
```

---

### Fix 3: Herbalist Vocation Check

**Goal:** Use `character.vocation === 'herbalist'` instead of `profile.isHerbalist`.

**Files to modify:**
- `src/app/brew/page.tsx`

**Implementation:**
Change from `if (!profile.isHerbalist)` to `if (character?.vocation !== 'herbalist')`.

Reorder gating logic:
1. Check auth (redirect if not authenticated)
2. Check character exists (show CTA if not)
3. Check vocation is herbalist (show message if not)

---

### Fix 4: Full-Page Character CTA on Inventory

**Goal:** Show full-page CTA when no character exists, not just partial in equipment section.

**Files to modify:**
- `src/app/inventory/page.tsx`

**Implementation:**
After auth loading check, add character existence check with full-page CTA.

---

### Fix 5: Type Safety - CharacterRecipe Join Transformation

**Goal:** Transform `fetchCharacterRecipes` to follow the same pattern as `fetchCharacterHerbs`.

**Files to modify:**
- `src/lib/db/characterInventory.ts` - Transform join data
- `src/lib/types.ts` - Update CharacterRecipe type

**Implementation:**
1. In `types.ts`, change CharacterRecipe:
   - Remove: `recipes?: Recipe`
   - Add: `recipe: Recipe` (required, singular)

2. In `fetchCharacterRecipes`, add transformation:
   ```typescript
   const transformed = (data || []).map(row => ({
     ...row,
     recipe: row.recipes as Recipe,
     recipes: undefined,
   })) as CharacterRecipe[]
   ```

3. In `brew/page.tsx`, simplify recipe extraction:
   - Remove filter for `cr.recipes`
   - Change: `cr.recipes as Recipe` → `cr.recipe`

---

### Fix 6: Cleanup - Remove Unused Variables

**Goal:** Remove unused `profileId` destructuring.

**Files to modify:**
- `src/app/forage/page.tsx` - Remove `profileId` from useProfile destructuring
- `src/app/brew/page.tsx` - Remove `profileId` from useProfile destructuring

---

## Execution Order

1. Recipe initialization (most impactful)
2. Type safety fix (affects brew page, do before other brew changes)
3. Vocation check (depends on type safety)
4. Auth redirects
5. Inventory CTA
6. Cleanup

---

## Verification Checklist

- [ ] Build passes (`npm run build`)
- [ ] New herbalist character gets base recipes
- [ ] New non-herbalist character has empty recipe book
- [ ] Forage/Brew redirect to /login when not authenticated
- [ ] Brew shows "herbalist only" message for non-herbalist characters
- [ ] Inventory shows full-page CTA when no character
- [ ] No TypeScript errors or unused variable warnings
