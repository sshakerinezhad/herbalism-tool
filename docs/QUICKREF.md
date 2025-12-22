# Quick Reference

One-page cheat sheet for the herbalism-tool codebase.

---

## 🗂️ Key Paths

| Path | Purpose |
|------|---------|
| `src/app/*/page.tsx` | All pages (routes) |
| `src/components/` | Reusable React components |
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

**Herbalism (Legacy):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Users | id (uuid), username, is_herbalist |
| `herbs` | All herbs | name, rarity, elements[] |
| `biomes` | Locations | name |
| `biome_herbs` | Herb spawns | biome_id, herb_id, weight |
| `recipes` | Brewing formulas | name, elements[], type, is_secret |
| `user_inventory` | Owned herbs | user_id, herb_id, quantity |
| `user_brewed` | Crafted items | user_id, type, effects[], choices |
| `user_recipes` | Known recipes | user_id, recipe_id |

**Knights of Belyar (New):**

| Table | Purpose |
|-------|---------|
| `characters` | Core character data (stats, class, race, etc.) |
| `skills` | Reference: 26 skills |
| `armor_slots` | Reference: 12 body slots |
| `character_skills` | Skill proficiencies |
| `character_armor` | Equipped armor |
| `character_weapons` | Weapons |
| `character_items` | General inventory |

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

## 📦 Component Imports

```typescript
// UI components
import { PageLayout, LoadingState, ErrorDisplay } from '@/components/ui'

// Element display
import { ElementBadge, ElementList } from '@/components/elements'

// Brewing
import { HerbSelector, PairingPhase, ChoicesPhase, ResultPhase } from '@/components/brew'

// Inventory
import { HerbRow, BrewedItemCard, ElementSummary } from '@/components/inventory'

// Recipes
import { RecipeCard } from '@/components/recipes'
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

### Page Structure

```tsx
'use client'
export default function Page() {
  const { profileId, isLoaded } = useProfile()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (profileId) loadData()
  }, [profileId])
  
  if (!isLoaded || loading) return <LoadingState />
  
  return <PageLayout>{/* content */}</PageLayout>
}
```

---

## ⚠️ Gotchas

1. **Auth Required:** No guest mode. Pages redirect to `/login` if not authenticated.
2. **Field Mismatch:** `brewingModifier` in app = `herbalism_modifier` in DB
3. **Type Casting:** Use `as unknown as Type` for Supabase joins
4. **RLS Status:** ON for new character tables, OFF for legacy herbalism tables
5. **Sessions in localStorage:** Foraging sessions don't sync across devices
6. **Navigation in useEffect:** Always use `router.push()` inside `useEffect`, never during render
7. **RecipeType:** Defined in `constants.ts`, re-exported from `types.ts` for convenience

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

**New Constant:**
1. Add to `src/lib/constants.ts`
2. Export it
3. Import where needed

---

*Print this and pin it next to your monitor!*

