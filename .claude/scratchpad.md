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

### Fix 2: Auth Redirects for Forage/Brew ✅ COMPLETED

**Goal:** Add consistent auth handling to forage and brew pages - redirect to `/login` if user is not authenticated.

**Context:** Currently, both pages check `authLoading` for skeleton display but don't redirect unauthenticated users. The profile page (`src/app/profile/page.tsx:166-170`) has the correct pattern to follow.

**Implementation:**
- Added `import { useRouter } from 'next/navigation'` to both pages
- Added `const router = useRouter()` in both components
- Added redirect useEffect that checks `!authLoading && !user` and redirects to `/login`
- `src/app/forage/page.tsx:12-13,34,72-77` - Import, router init, and redirect effect
- `src/app/brew/page.tsx:14-15,81,132-137` - Import, router init, and redirect effect
- Build passes successfully ✅

**Reference Pattern (from profile page):**
```typescript
import { useRouter } from 'next/navigation'
// ...
const router = useRouter()
// ...
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
  }
}, [authLoading, user, router])
```

**Changes:**

#### 1. `src/app/forage/page.tsx`

**Add import** (around line 11):
```typescript
import { useRouter } from 'next/navigation'
```

**Add router initialization** (after line 33, inside `ForagePage` component):
```typescript
const router = useRouter()
```

**Add redirect effect** (after the router initialization):
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
  }
}, [authLoading, user, router])
```

#### 2. `src/app/brew/page.tsx`

**Add import** (around line 13):
```typescript
import { useRouter } from 'next/navigation'
```

**Add router initialization** (after line 80, inside `BrewPage` component):
```typescript
const router = useRouter()
```

**Add redirect effect** (after the router initialization):
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login')
  }
}, [authLoading, user, router])
```

**Verification:**
- Run `npm run build` to ensure no TypeScript errors
- Test manually: visit `/forage` or `/brew` while logged out → should redirect to `/login`

---

### Fix 3: Herbalist Vocation Check ✅ COMPLETED

**Goal:** Use `character.vocation === 'herbalist'` instead of `profile.isHerbalist`.

**Implementation:**
- Removed deprecated `profile.isHerbalist` check from `src/app/brew/page.tsx` (old lines 557-574)
- Added new vocation check using `character.vocation !== 'herbalist'` at lines 581-599
- Properly ordered render checks:
  1. Loading skeleton (lines 557-559)
  2. Character existence check (lines 561-579)
  3. Herbalist vocation check (lines 581-599)
- Build passes successfully ✅

**Changes:**
- `src/app/brew/page.tsx:557-599` - Removed profile-based check, added character-based vocation check

---

### Fix 4: Full-Page Character CTA on Inventory ✅ COMPLETED

**Goal:** Show a full-page CTA when no character exists on the inventory page, instead of just rendering an empty/broken UI.

**Implementation:**
- Added character existence check to `src/app/inventory/page.tsx` at lines 136-154
- Check occurs after loading state but before main render
- Shows full-page CTA with "Create Character" link when no character exists
- Build passes successfully ✅

**Check Order After Fix:**
1. Loading skeleton (lines 132-134)
2. Character existence check (lines 136-154) ✅ NEW
3. Main render with full inventory UI

**Changes:**
- `src/app/inventory/page.tsx:136-154` - Added character existence gate with full-page CTA

---

### Fix 5: Type Safety - CharacterRecipe Join Transformation ✅ COMPLETED

**Goal:** Transform `fetchCharacterRecipes` to follow the same pattern as `fetchCharacterHerbs` - transforming the Supabase join data to use a cleaner property name (`recipe` instead of `recipes`).

**Current State:**

#### 1. `src/lib/types.ts` (line 359-364)
```typescript
export type CharacterRecipe = {
  id: number
  character_id: string
  recipe_id: number
  unlocked_at: string
  recipes?: Recipe  // Joined from recipes table - plural, optional
}
```

#### 2. `src/lib/db/characterInventory.ts` (lines 222-239)
```typescript
export async function fetchCharacterRecipes(characterId: string): Promise<{
  data: CharacterRecipe[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_recipes')
    .select(`*, recipes (*)`)
    .eq('character_id', characterId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterRecipe[], error: null }  // NO transformation!
}
```

#### 3. `src/app/brew/page.tsx` (lines 107-111)
```typescript
const recipes = useMemo(() => {
  return characterRecipes
    .filter((cr: CharacterRecipe) => cr.recipes)  // Filter needed because optional
    .map((cr: CharacterRecipe) => cr.recipes as Recipe)  // Cast needed
    .sort((a, b) => a.name.localeCompare(b.name))
}, [characterRecipes])
```

**Pattern to Follow:**

**`fetchCharacterHerbs`** (lines 34-58) does it right:
```typescript
// Transform joined data
const transformed = (data || []).map(row => ({
  ...row,
  herb: row.herbs as Herb,
  herbs: undefined,
})) as CharacterHerb[]

return { data: transformed, error: null }
```

**Implementation:**

#### Step 1: Update `src/lib/types.ts` (line 364)

Change:
```typescript
recipes?: Recipe  // Joined from recipes table
```

To:
```typescript
recipe?: Recipe  // Joined from recipes table (singular, transformed)
```

#### Step 2: Update `src/lib/db/characterInventory.ts` (lines 234-238)

Change:
```typescript
return { data: data as CharacterRecipe[], error: null }
```

To:
```typescript
// Transform joined data (match pattern from fetchCharacterHerbs)
const transformed = (data || []).map(row => ({
  ...row,
  recipe: row.recipes as Recipe,
  recipes: undefined,
})) as CharacterRecipe[]

return { data: transformed, error: null }
```

#### Step 3: Update `src/app/brew/page.tsx` (lines 107-111)

Change:
```typescript
const recipes = useMemo(() => {
  return characterRecipes
    .filter((cr: CharacterRecipe) => cr.recipes)
    .map((cr: CharacterRecipe) => cr.recipes as Recipe)
    .sort((a, b) => a.name.localeCompare(b.name))
}, [characterRecipes])
```

To:
```typescript
const recipes = useMemo(() => {
  return characterRecipes
    .filter((cr: CharacterRecipe) => cr.recipe)
    .map((cr: CharacterRecipe) => cr.recipe as Recipe)
    .sort((a, b) => a.name.localeCompare(b.name))
}, [characterRecipes])
```

**Files to Modify:**
1. `src/lib/types.ts` - Line 364: `recipes?` → `recipe?`
2. `src/lib/db/characterInventory.ts` - Lines 234-238: Add transformation
3. `src/app/brew/page.tsx` - Lines 109-110: `cr.recipes` → `cr.recipe`

**Implementation:**
- Updated `src/lib/types.ts:364` - Changed `recipes?: Recipe` to `recipe?: Recipe`
- Updated `src/lib/db/characterInventory.ts:16-27` - Added `Recipe` to imports
- Updated `src/lib/db/characterInventory.ts:238-245` - Added transformation logic matching `fetchCharacterHerbs` pattern
- Updated `src/app/brew/page.tsx:109-110` - Changed `cr.recipes` to `cr.recipe` in useMemo
- Build passes successfully ✅

---

### Fix 6: Cleanup - Remove Unused Variables ✅ COMPLETED

**Goal:** Remove unused `profileId` destructuring from `useProfile()` calls in forage and brew pages.

**Files to Modify:**

#### 1. `src/app/forage/page.tsx` (lines 36-43)

**Current:**
```typescript
const {
  profile,
  profileId,
  isLoaded: profileLoaded,
  sessionsUsedToday,
  spendForagingSessions,
  longRest
} = useProfile()
```

**Change to:**
```typescript
const {
  profile,
  isLoaded: profileLoaded,
  sessionsUsedToday,
  spendForagingSessions,
  longRest
} = useProfile()
```

#### 2. `src/app/brew/page.tsx` (line 83)

**Current:**
```typescript
const { profile, profileId, isLoaded: profileLoaded } = useProfile()
```

**Change to:**
```typescript
const { profile, isLoaded: profileLoaded } = useProfile()
```

**Implementation:**
- Removed `profileId` from `src/app/forage/page.tsx:36-42`
- Removed `profileId` from `src/app/brew/page.tsx:83`
- Build passes successfully ✅

**Verification:**
- ✅ Build passes (`npm run build`)
- ✅ No "unused variable" warnings remain

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

- [x] Build passes (`npm run build`)
- [ ] New herbalist character gets base recipes
- [ ] New non-herbalist character has empty recipe book
- [x] Forage/Brew redirect to /login when not authenticated
- [x] Brew shows "herbalist only" message for non-herbalist characters
- [x] Inventory shows full-page CTA when no character
- [x] No TypeScript errors or unused variable warnings

---

## Post-Review Fixes ✅ COMPLETED

**Context:** Codex identified three remaining issues after the initial migration fixes.

### Fix 1: Remove Legacy Recipe Seeding ✅ COMPLETED

**Problem:** `initializeBaseRecipes()` in `src/lib/profiles.ts:87-92` was still populating deprecated `user_recipes` table on profile creation.

**Implementation:**
- Removed import: `import { initializeBaseRecipes } from './recipes'` (line 10)
- Removed function call and error handling block (lines 87-92)
- Build passes successfully ✅

### Fix 2: Add Join Guard to fetchCharacterRecipes ✅ COMPLETED

**Problem:** `fetchCharacterRecipes` didn't guard against orphaned joins (deleted recipes).

**Implementation:**
- Added `.filter(row => row.recipes)` before transformation in `src/lib/db/characterInventory.ts:241`
- Prevents null recipe data from being cast to Recipe type
- Build passes successfully ✅

### Fix 3: Brew Mutation Error Handling ✅ COMPLETED

**Problem:** Both `executeBrew` and `executeBrewWithEffects` ignored mutation failures, risking data desync.

**Implementation:**

#### `executeBrew` (src/app/brew/page.tsx:365-407)
- Added error checking to herb removal loop (lines 377-380)
- Added error checking to `addCharacterBrewedItem` (lines 387-399)
- Aborts brewing and sets `mutationError` state on failure
- Still invalidates herb cache if item creation fails (herbs already consumed)

#### `executeBrewWithEffects` (src/app/brew/page.tsx:493-575)
- Added error checking to herb removal loop (lines 505-508)
- Added error checking to single-batch `addCharacterBrewedItem` (lines 521-533)
- Added error checking to batch-loop `addCharacterBrewedItem` (lines 556-566)
- In batch mode, continues brewing remaining items but logs error
- Build passes successfully ✅

**Error UX:**
- Herb removal fails → abort immediately, show error
- Item creation fails → abort (single) or continue batch (batch mode), show error
- Uses existing `mutationError` state for user feedback

**Files Modified:**
1. `src/lib/profiles.ts` - Removed legacy seeding
2. `src/lib/db/characterInventory.ts` - Added join guard
3. `src/app/brew/page.tsx` - Added mutation error handling

**Verification:**
- ✅ Build passes (`npm run build`)
- ✅ All TypeScript checks pass

---

## Final Polish: Brew Error Recovery + Cleanup ✅ COMPLETED

**Context:** Codex review identified UI getting stuck on "Brewing..." when errors occur, and unused imports.

### Fix 1: Brew Error Recovery UI ✅ COMPLETED

**Problem:** When herb removal or brewed item creation fails, `mutationError` is set but phase remains `'brewing'`, leaving user stuck on ⚗️ animation with no recovery action.

**Solution:** Modified brewing phase render to show error state with "Start Over" button when `mutationError` is set.

**Implementation:**
- Updated `src/app/brew/page.tsx:799-822`
- Added conditional render checking `mutationError` state
- Error state shows 💥 icon, error message, and reset button
- Button calls existing `reset()` function to return to initial phase
- Build passes successfully ✅

**UX Flow:**
- Normal brewing: Shows ⚗️ with "Brewing..."
- Brewing fails: Shows 💥 with "Brewing failed", error details, and "Start Over" button
- Click "Start Over": Calls `reset()` → returns to `select-herbs` or `select-recipes`

### Fix 2: Remove Unused LoadingState Imports ✅ COMPLETED

**Problem:** `LoadingState` imported but never used in forage and brew pages (lint warnings).

**Implementation:**
- Removed from `src/app/brew/page.tsx:38`
- Removed from `src/app/forage/page.tsx:21`
- Loading states handled by `BrewSkeleton` and `ForageSkeleton` instead
- Build passes successfully ✅

**Files Modified:**
1. `src/app/brew/page.tsx` - Added error recovery UI, removed unused import
2. `src/app/forage/page.tsx` - Removed unused import

**Verification:**
- ✅ Build passes (`npm run build`)
- ✅ No TypeScript errors or lint warnings

---

## Deprecate profile.isHerbalist Migration ✅ COMPLETED

**Context:** Completed full migration from `profile.isHerbalist` to `character.vocation === 'herbalist'` across remaining pages, plus fixed batch brewing successCount bug.

### Fix 1: Home Page Migration ✅ COMPLETED

**Goal:** Replace `profile.isHerbalist` usage with character-based vocation check.

**Implementation:**
- Added `useCharacter` import to `src/app/page.tsx:7`
- Added `useCharacter` hook call at line 14: `const { data: character } = useCharacter(user?.id ?? null)`
- Derived `isHerbalist` from character vocation at line 18: `const isHerbalist = character?.vocation === 'herbalist'`
- Replaced `profile.isHerbalist` → `isHerbalist` at lines 93, 102, 135
- Build passes successfully ✅

**Behavior:** When no character exists, `isHerbalist` is `false` - user sees disabled brew link, which is correct since brewing requires a character.

### Fix 2: Inventory Page Migration ✅ COMPLETED

**Goal:** Replace `profile?.isHerbalist` usage with character-based vocation check.

**Implementation:**
- Derived `isHerbalist` from character vocation at `src/app/inventory/page.tsx:113`: `const isHerbalist = character?.vocation === 'herbalist'`
- Updated `HerbalismSectionProps` interface at line 821: Changed `profile: { isHerbalist: boolean } | null` → `isHerbalist: boolean`
- Updated `HerbalismSection` function signature at line 831: Changed destructured `profile` → `isHerbalist`
- Updated `HerbalismSection` call at line 225: Changed `profile={profile}` → `isHerbalist={isHerbalist}`
- Replaced `profile?.isHerbalist` → `isHerbalist` at line 1080 (brewed tab conditional)
- Build passes successfully ✅

### Fix 3: Batch Brewing successCount Bug ✅ COMPLETED

**Goal:** Only increment `successCount` after successful database save, not before.

**Problem:** `successCount++` occurred before checking if `addCharacterBrewedItem` succeeded, causing failed saves to be counted as successes in results screen.

**Implementation:**
- Modified `src/app/brew/page.tsx:553-567`
- Moved `successCount++` inside the `else` block after successful save
- Failed saves now properly excluded from success count
- Build passes successfully ✅

**Files Modified:**
1. `src/app/page.tsx` - Added useCharacter hook, derived isHerbalist from character.vocation
2. `src/app/inventory/page.tsx` - Derived isHerbalist from character.vocation, updated HerbalismSection interface and props
3. `src/app/brew/page.tsx` - Moved successCount++ after successful save check

**Verification:**
- ✅ Build passes (`npm run build`)
- ✅ All TypeScript checks pass
- ✅ profile.isHerbalist fully deprecated across all pages
