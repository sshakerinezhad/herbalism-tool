# Quick Reference

One-page cheat sheet for the herbalism-tool codebase.

---

## 🗂️ Key Paths

| Path | Purpose |
|------|---------|
| `src/app/*/page.tsx` | All pages (routes) |
| `src/components/` | Reusable React components |
| `src/components/ui/` | Generic UI (Layout, Loading, Skeleton, PrefetchLink) |
| `src/lib/hooks/` | **React Query hooks** (data fetching + caching) |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/constants.ts` | Shared constants (elements, DCs, etc.) |
| `src/lib/auth.tsx` | Auth context + provider |
| `src/lib/profile.tsx` | Profile context + provider |
| `src/lib/profiles.ts` | Profile CRUD operations |
| `src/lib/inventory.ts` | Inventory operations |
| `src/lib/brewing.ts` | Brewing logic + operations |
| `src/lib/recipes.ts` | Recipe operations |

---

## 🎲 Game Constants

```typescript
import { 
  FORAGING_DC,        // 13
  BREWING_DC,         // 15
  MAX_HERBS_PER_BREW, // 6
  RARITY_ORDER,       // ['common', 'uncommon', 'rare', ...]
  ELEMENT_SYMBOLS,    // { fire: '🔥', water: '💧', ... }
  ELEMENT_COLORS,     // Color schemes per element
} from '@/lib/constants'
```

---

## 🧪 Elements

| Element | Symbol | Primary Color |
|---------|--------|---------------|
| Fire | 🔥 | Red |
| Water | 💧 | Blue |
| Earth | ⛰️ | Green |
| Air | 💨 | Gray |
| Positive | ✨ | Yellow |
| Negative | 💀 | Purple |

---

## 📊 Database Tables

**Reference Data:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Users | id (uuid), username, is_herbalist |
| `herbs` | All herbs | name, rarity, elements[] |
| `biomes` | Locations | name |
| `biome_herbs` | Herb spawns | biome_id, herb_id, weight |
| `recipes` | Brewing formulas | name, elements[], type, is_secret |
| `skills` | Reference: 26 skills | name, ability |
| `armor_slots` | Reference: 12 body slots | name, position |

**Character Data (all tied to character_id):**

| Table | Purpose |
|-------|---------|
| `characters` | Core character data (stats, class, race, etc.) |
| `character_skills` | Skill proficiencies |
| `character_armor` | Equipped armor |
| `character_weapons` | Owned weapons |
| `character_items` | General inventory |
| `character_weapon_slots` | 6 weapon slots (3 per hand) |
| `character_quick_slots` | 6 quick access combat slots |
| `character_herbs` | Herb inventory (foraging) |
| `character_brewed` | Crafted items (elixirs/bombs/oils) |
| `character_recipes` | Known brewing recipes |

**Legacy Tables (DEPRECATED - do not use):**
- `user_inventory`, `user_brewed`, `user_recipes` - replaced by character_* equivalents

---

## 🔌 Context Hooks

```typescript
// Auth state (required - no guest mode)
const { user, session, isLoading, signIn, signUp, signOut } = useAuth()

// Profile state (requires authenticated user)
const { 
  profile,           // User's character data
  profileId,         // UUID from auth.uid()
  isLoaded,          // Profile loaded?
  sessionsUsedToday, // Foraging sessions spent
  updateProfile,     // Update profile fields
  spendForagingSessions, // Use foraging sessions
  longRest           // Reset sessions
} = useProfile()
```

**Note:** If `!user`, pages redirect to `/login`.

---

## 📦 React Query Hooks

```typescript
import {
  // Character data
  useCharacter,
  useCharacterSkills,
  useCharacterArmor,
  useCharacterWeapons,
  useCharacterItems,
  useCharacterWeaponSlots,
  useCharacterQuickSlots,

  // Character-based herbalism
  useCharacterHerbs,       // Herb inventory
  useCharacterBrewedItems, // Crafted items
  useCharacterRecipesNew,  // Known recipes
  useBiomes,               // Reference data for foraging

  // Reference data
  useArmorSlots,
  useSkills,

  // Cache management
  useInvalidateQueries,
  usePrefetch,
} from '@/lib/hooks'

// Usage - herbalism requires characterId
const { data: character } = useCharacter(userId)
const { data: herbs } = useCharacterHerbs(character?.id ?? null)

// After mutations
const { invalidateCharacterHerbs } = useInvalidateQueries()
await addCharacterHerbs(characterId, herbId, quantity)
invalidateCharacterHerbs(characterId)
```

---

## 📦 Component Imports

```typescript
// UI components
import { 
  PageLayout, 
  LoadingState, 
  ErrorDisplay,
  PrefetchLink,           // Smart link with prefetching
  InventorySkeleton,      // Page skeletons
  ForageSkeleton,
  BrewSkeleton,
  RecipesSkeleton,
  ProfileSkeleton,
} from '@/components/ui'

// Element display
import { ElementBadge, ElementList } from '@/components/elements'

// Brewing
import { HerbSelector, PairingPhase, ChoicesPhase, ResultPhase } from '@/components/brew'

// Inventory
import { HerbRow, BrewedItemCard, ElementSummary } from '@/components/inventory'

// Recipes
import { RecipeCard } from '@/components/recipes'

// Character
import { ArmorDiagram } from '@/components/ArmorDiagram'
import { CoinPurse, WeaponSlots, QuickSlots } from '@/components/character'

// Item details
import { ItemTooltip } from '@/components/ui'
```

---

## 🔧 Common Patterns

### Database Operation

```typescript
const { data, error } = await someOperation(userId)
if (error) {
  setError(error)
  return
}
// Use data
```

### Page Structure (with React Query)

```tsx
'use client'
import { useInventory } from '@/lib/hooks'
import { InventorySkeleton } from '@/components/ui'

export default function Page() {
  const { profileId, isLoaded } = useProfile()
  const { data: inventory, isLoading } = useInventory(profileId)
  
  if (!isLoaded || isLoading) return <InventorySkeleton />
  
  return <PageLayout>{/* content */}</PageLayout>
}
```

### PrefetchLink Usage

```tsx
<PrefetchLink 
  href="/inventory" 
  prefetch="inventory"  // Type: 'inventory' | 'forage' | 'brew' | 'recipes' | 'profile'
  profileId={profileId}
>
  View Inventory
</PrefetchLink>
```

### Invalidate After Mutation

```tsx
const { invalidateInventory } = useInvalidateQueries()

async function handleAdd() {
  await addHerbsToInventory(profileId, herbs)
  invalidateInventory(profileId)  // Refresh cache
}
```

---

## ⚠️ Gotchas

1. **Auth Required:** No guest mode. Pages redirect to `/login` if not authenticated.
2. **Character Required for Herbalism:** Forage/Brew pages require a character to exist.
3. **Field Mismatch:** `brewingModifier` in app = `herbalism_modifier` in DB
4. **Type Casting:** Use `as unknown as Type` for Supabase joins
5. **RLS Status:** ON for all character tables including herbalism
6. **Sessions in localStorage:** Foraging sessions are scoped to user ID, don't sync across devices
7. **Navigation in useEffect:** Always use `router.push()` inside `useEffect`, never during render
8. **Legacy Tables:** `user_inventory`, `user_brewed`, `user_recipes` are deprecated - use character_* tables

---

## 🚀 Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Check for errors
```

---

## 📁 New File Checklist

**New Component:**
1. Create in `src/components/{feature}/`
2. Add JSDoc comment
3. Export from `index.ts`

**New Page:**
1. Create `src/app/{route}/page.tsx`
2. Add `'use client'`
3. Use `<PageLayout>`
4. Use React Query hooks for data
5. Add skeleton loading state

**New Data Hook:**
1. Add fetcher to `fetchers` object in `queries.ts`
2. Add query key to `queryKeys`
3. Create `useXxx` hook
4. (Optional) Add prefetch function
5. (Optional) Add skeleton in `Skeleton.tsx`

**New Constant:**
1. Add to `src/lib/constants.ts`
2. Export it
3. Import where needed

---

*Print this and pin it next to your monitor!*

*Last updated: December 2025*

