# Quick Reference

One-page cheat sheet for the herbalism-tool codebase.

---

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/*/page.tsx` | All pages (routes) |
| `src/components/` | Reusable React components |
| `src/components/ui/` | Generic UI (PageLayout, Loading, Skeleton, etc.) |
| `src/lib/hooks/` | React Query hooks (data fetching + caching) |
| `src/lib/db/` | Database operations (characters, inventory, biomes) |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/constants.ts` | Shared constants (elements, DCs, classes, races, etc.) |
| `src/lib/auth.tsx` | Auth context + provider |
| `src/lib/profile.tsx` | Profile context + provider |
| `src/lib/brewing.ts` | Brewing logic (pairing, potency, template rendering) |
| `src/lib/dice.ts` | Dice rolling utilities |
| `src/lib/database.types.ts` | Auto-generated Supabase types |

---

## Pages

| Route | File |
|-------|------|
| `/` | `src/app/page.tsx` (Home) |
| `/login` | `src/app/login/page.tsx` |
| `/profile` | `src/app/profile/page.tsx` |
| `/create-character` | `src/app/create-character/page.tsx` |
| `/edit-character` | `src/app/edit-character/page.tsx` |
| `/forage` | `src/app/forage/page.tsx` |
| `/inventory` | `src/app/inventory/page.tsx` |
| `/brew` | `src/app/brew/page.tsx` |
| `/recipes` | `src/app/recipes/page.tsx` |

---

## Database Tables

**Reference Data:**

| Table | Purpose |
|-------|---------|
| `profiles` | Users (id = auth.uid()) |
| `herbs` | All herbs (name, rarity, elements[]) |
| `biomes` / `biome_herbs` | Foraging locations + herb spawn weights |
| `recipes` | Brewing formulas (elements[], type, is_secret) |
| `skills` | 26 skills reference |
| `armor_slots` | 12 body slot reference |
| `weapon_templates` | Weapon base stats |
| `materials` | Weapon/armor materials |
| `item_templates` | General item definitions |

**Character Data (all keyed on `character_id`):**

| Table | Purpose |
|-------|---------|
| `characters` | Core stats, class, race, order, money |
| `character_skills` | Skill proficiencies |
| `character_armor` | Equipped armor pieces |
| `character_weapons` | Owned weapons |
| `character_items` | General inventory |
| `character_weapon_slots` | 6 weapon slots (3 per hand) |
| `character_quick_slots` | 6 quick-access combat slots |
| `character_herbs` | Herb inventory (foraging) |
| `character_brewed` | Crafted elixirs/bombs/oils |
| `character_recipes` | Known brewing recipes |

---

## React Query Hooks

```typescript
import {
  // Character
  useCharacter,          // useCharacter(userId)
  useCharacterSkills,    // useCharacterSkills(characterId)
  useCharacterArmor,     // useCharacterArmor(characterId)

  // Equipment
  useCharacterWeapons,
  useCharacterItems,
  useCharacterWeaponSlots,
  useCharacterQuickSlots,
  useWeaponTemplates,
  useMaterials,
  useItemTemplates,

  // Herbalism (character-based)
  useCharacterHerbs,         // Herb inventory
  useCharacterBrewedItems,   // Crafted items
  useCharacterRecipesNew,    // Known recipes
  useCharacterRecipeStats,   // Recipe discovery stats
  useBiomes,                 // Biome reference data

  // Reference data
  useArmorSlots,
  useSkills,

  // Cache management
  useInvalidateQueries,
  usePrefetch,
} from '@/lib/hooks'
```

### Usage Pattern

```typescript
const { data: character } = useCharacter(userId)
const { data: herbs } = useCharacterHerbs(character?.id ?? null)

// After mutations
const { invalidateCharacterHerbs } = useInvalidateQueries()
await addCharacterHerbs(characterId, herbId, quantity)
invalidateCharacterHerbs(characterId)
```

---

## Context Hooks

```typescript
// Auth (required — no guest mode)
const { user, session, isLoading, signIn, signUp, signOut } = useAuth()

// Profile (requires authenticated user)
const { profile, profileId, isLoaded, updateProfile, longRest } = useProfile()
```

If `!user`, pages redirect to `/login`.

---

## Component Imports

```typescript
// UI
import { PageLayout, ErrorDisplay, LoadingState, ItemTooltip } from '@/components/ui'
import { InventorySkeleton, ForageSkeleton, BrewSkeleton } from '@/components/ui'
import PrefetchLink from '@/components/PrefetchLink'

// Elements
import { ElementBadge } from '@/components/elements'

// Brewing
import { HerbSelector, PairingPhase, ChoicesPhase, ResultPhase } from '@/components/brew'

// Inventory
import { HerbRow, BrewedItemCard, ElementSummary } from '@/components/inventory'
import { WeaponsTab, ItemsTab, EquipmentSection } from '@/components/inventory/equipment'
import { HerbalismSection } from '@/components/inventory/herbalism'

// Forage
import { SetupPhase, ResultsPhase, BiomeCard } from '@/components/forage'
import type { ForagedHerb } from '@/components/forage'

// Character
import { ArmorDiagram } from '@/components/ArmorDiagram'
import { CoinPurse, WeaponSlots, QuickSlots, CharacterBanner } from '@/components/character'

// Create-Character Wizard
import { StepName, StepRace, StepBackground, StepClass, StepOrder } from '@/components/character/wizard'
import { StepStats, StepSkills, StepVocation } from '@/components/character/wizard'
import { StepEquipment, StepReview } from '@/components/character/wizard'
import type { WizardStep, WizardData, StepProps } from '@/components/character/wizard'

// Recipes
import { RecipeCard } from '@/components/recipes'
```

---

## Common Patterns

### Page Structure

```tsx
'use client'
import { useAuth } from '@/lib/auth'
import { useCharacter, useCharacterHerbs } from '@/lib/hooks'
import { PageLayout, InventorySkeleton } from '@/components/ui'

export default function Page() {
  const { user } = useAuth()
  const { data: character } = useCharacter(user?.id ?? null)
  const { data: herbs, isLoading } = useCharacterHerbs(character?.id ?? null)

  if (isLoading) return <InventorySkeleton />

  return <PageLayout>{/* content */}</PageLayout>
}
```

### Invalidate After Mutation

```tsx
const { invalidateCharacterHerbs } = useInvalidateQueries()

async function handleAdd() {
  await addCharacterHerbs(characterId, herbId, quantity)
  invalidateCharacterHerbs(characterId)
}
```

---

## Gotchas

1. **Auth required:** No guest mode — pages redirect to `/login`
2. **Character required for herbalism:** Forage/Brew pages need a character to exist
3. **Field mismatch:** `brewingModifier` in app = `herbalism_modifier` in DB
4. **Type casting:** Use `as Type` for Supabase joins. Avoid `as unknown as Type` — it hides bugs (see CLAUDE.md gotcha #3)
5. **RLS active:** ON for all character tables including herbalism
6. **Sessions in localStorage:** Foraging sessions scoped to user ID, don't sync across devices

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run db:types # Generate TypeScript types from Supabase
npm run db:push  # Push migrations to remote
```

---

## New File Checklist

**New Component:** Create in `src/components/{feature}/`, export from `index.ts`

**New Page:** Create `src/app/{route}/page.tsx`, add `'use client'`, use `<PageLayout>`, use React Query hooks, add skeleton

**New Data Hook:** Add fetcher + query key + hook to `src/lib/hooks/queries.ts`, optionally add prefetch + invalidation helpers

**New DB Operation:** Add to appropriate file in `src/lib/db/`, return `{ data?, error }` pattern

*Last updated: March 2026*
