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

- [ ] Build passes (`npm run build`)
- [ ] New herbalist character gets base recipes
- [ ] New non-herbalist character has empty recipe book
- [ ] Forage/Brew redirect to /login when not authenticated
- [ ] Brew shows "herbalist only" message for non-herbalist characters
- [ ] Inventory shows full-page CTA when no character
- [ ] No TypeScript errors or unused variable warnings
