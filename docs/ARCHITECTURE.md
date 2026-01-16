# Architecture Deep Dive

This document provides a technical deep-dive into the herbalism-tool codebase. It covers implementation details, design decisions, data flows, and the "why" behind key choices.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Layer](#data-layer)
3. [Authentication System](#authentication-system)
4. [Profile Management](#profile-management)
5. [Foraging System](#foraging-system)
6. [Brewing System](#brewing-system)
7. [Recipe System](#recipe-system)
8. [State Management Patterns](#state-management-patterns)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)

---

## System Architecture

### Why Client-Side Rendering?

The app uses `'use client'` throughout. This decision was made because:

1. **Real-time state**: Profile, inventory, and session data change frequently
2. **Supabase client SDK**: Works naturally in browser context
3. **No SEO requirements**: This is an app, not content
4. **Simpler mental model**: No server/client boundary confusion

**Trade-off:** Initial load is slightly slower. No pre-rendering benefits.

### Provider Hierarchy

```tsx
// src/app/providers.tsx
<AuthProvider>
  <ProfileProvider>
    {children}
  </ProfileProvider>
</AuthProvider>
```

ProfileProvider lives inside AuthProvider because:
- Profile loading depends on auth state
- When auth changes, profile needs to reload
- Profile uses `user?.id` to determine profile ID

### Module Dependency Graph

```
Pages
  ├── components/*       (UI components)
  ├── lib/hooks          (React Query hooks - DATA LAYER)
  ├── lib/constants      (shared constants)
  ├── lib/types          (shared types)
  └── lib/*              (domain logic + DB operations)
        └── lib/supabase (database client)
```

Rules:
- Pages can import from anywhere
- Pages use `@/lib/hooks` for data fetching (not direct lib/*.ts calls)
- Components import from lib/ but not other pages
- lib/hooks imports from lib/*.ts for actual DB operations
- lib/ modules can import from each other
- supabase.ts is the leaf - imports nothing from app

### Data Flow (with React Query)

```
User navigates to page
         │
         ▼
    useXxx hook (from @/lib/hooks)
         │
         ├─► Cache hit? → Return cached data immediately
         │
         └─► Cache miss? → Call fetcher function
                              │
                              ▼
                         lib/*.ts (DB operations)
                              │
                              ▼
                         Supabase
                              │
                              ▼
                    Cache data, return to component
```

---

## Data Layer

### Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Single client instance, used everywhere. No server-side client needed since all operations are client-rendered.

### Type Safety Strategy

Currently, types are manually defined in `types.ts`. This works but has gaps:

```typescript
// Manual type definition
export interface Herb {
  id: number
  name: string
  rarity: string
  elements: string[]
  description?: string
}

// When querying with joins, we have to cast
const { data } = await supabase
  .from('user_inventory')
  .select('*, herbs(*)')

// data.herbs is typed as unknown by Supabase
// We cast: row.herbs as unknown as Herb
```

**Recommended improvement:** Generate types from Supabase schema:
```bash
npx supabase gen types typescript --project-id cliiijgqzwkiknukfgqc > src/lib/database.types.ts
```

### CRUD Pattern

All database operations follow this pattern:

```typescript
export async function getSomething(userId: string): Promise<{
  data?: SomeType[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Operation failed:', error)
    return { error: error.message }
  }

  return { data, error: null }
}
```

Benefits:
- Consistent error handling
- Easy to wrap in try/catch at call site
- No thrown exceptions to catch

---

## Authentication System

### AuthContext Implementation

```typescript
// src/lib/auth.tsx (simplified)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ... auth methods ...

  return (
    <AuthContext.Provider value={{ user, session, isLoading, ... }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Auth Methods

| Method | Use Case | Notes |
|--------|----------|-------|
| `signIn(email, password)` | Returning users | |
| `signUp(email, password)` | New accounts | |
| `signOut()` | Clear session | |

### Supabase Auth Configuration

Configured in Supabase dashboard:

- **Email provider:** Enabled
- **Confirm email:** Currently OFF (for easier testing)
- **New signups:** Allowed
- **Anonymous sign-ins:** Disabled
- **OAuth providers:** All disabled

---

## Profile Management

### Authentication Required

The app requires authentication. Unauthenticated users are redirected to `/login`.

```
┌─────────────────────────────────────────────────────────────┐
│                    ProfileProvider                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  profileId = user.id (from auth.uid())              │   │
│  │                                                      │   │
│  │  No user? → Profile stays at defaults               │   │
│  │            → Pages redirect to /login               │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│              getOrCreateProfile(user.id)                    │
│                           │                                 │
│                           ▼                                 │
│              Profile loaded into context                    │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Guest mode was removed. Users must sign up to use the app.

### Profile Creation Flow

```typescript
// src/lib/profiles.ts (simplified)
export async function getOrCreateProfile(userId: string) {
  // Try to fetch existing
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) {
    return { profile: mapDatabaseToProfile(existing), error: null }
  }

  // Create new profile with defaults
  const newProfile = {
    id: userId,
    username: '',
    is_herbalist: false,
    foraging_modifier: 0,
    herbalism_modifier: 0,
    max_foraging_sessions: 3,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .insert(newProfile)

  if (error) return { error: error.message }

  // Initialize base recipes for new user
  await initializeBaseRecipes(userId)

  return { profile: mapDatabaseToProfile(newProfile), error: null }
}
```

### Field Mapping

The database schema uses different names than the app:

```typescript
// Database → App mapping
function mapDatabaseToProfile(row: DatabaseRow): Profile {
  return {
    id: row.id,
    name: row.username,                    // ← Different!
    isHerbalist: row.is_herbalist,
    foragingModifier: row.foraging_modifier,
    brewingModifier: row.herbalism_modifier, // ← Confusing!
    maxForagingSessions: row.max_foraging_sessions
  }
}

// App → Database mapping
function mapProfileToDatabase(profile: Partial<Profile>): object {
  const updates: Record<string, unknown> = {}
  if (profile.name !== undefined) updates.username = profile.name
  if (profile.brewingModifier !== undefined) 
    updates.herbalism_modifier = profile.brewingModifier
  // ... etc
  return updates
}
```

**Why this mismatch?** Historical accident. The DB was created with `herbalism_modifier` but the app concept evolved to "brewing modifier." Fixing would require a database migration.

### Session Tracking

Foraging sessions are tracked in localStorage (scoped to user ID), not the database:

```typescript
// In ProfileProvider
const SESSIONS_KEY_PREFIX = 'herbalism-sessions-used'
const getSessionsKey = (userId: string) => `${SESSIONS_KEY_PREFIX}:${userId}`

// Load on init
const sessionsKey = getSessionsKey(user.id)
const stored = localStorage.getItem(sessionsKey)

// Save on change
localStorage.setItem(sessionsKey, sessionsUsedToday.toString())
```

**Why localStorage?**
- Sessions reset on "long rest" (sleep), not at midnight
- No need to persist across devices
- Simpler than tracking in DB
- Scoped to user ID to prevent cross-user session leakage

---

## Foraging System

### Core Algorithm

```typescript
// Pseudocode for foraging
function forage(biomeId: number, sessions: number, modifier: number) {
  const results = []
  
  for (let i = 0; i < sessions; i++) {
    const roll = rollD20()
    const total = roll + modifier
    
    if (roll === 20) {
      // Natural 20: roll twice on herb table
      results.push(...getHerbsFromBiome(biomeId, 2))
    } else if (roll === 1) {
      // Natural 1: automatic failure
      results.push({ success: false, roll, herbs: [] })
    } else if (total >= 13) {
      // Success: roll for quantity
      const quantity = rollQuantity()
      results.push(...getHerbsFromBiome(biomeId, quantity))
    } else {
      // Failure
      results.push({ success: false, roll, herbs: [] })
    }
  }
  
  return results
}
```

### Quantity Table

Rolling for number of herbs found:

| d20 Roll | Herbs Found |
|----------|-------------|
| 1-5      | 1           |
| 6-10     | 2           |
| 11-15    | 3           |
| 16-18    | 4           |
| 19       | 5           |
| 20       | Roll twice  |

### Weighted Selection

Each biome has herbs with weights:

```sql
-- biome_herbs table
biome_id | herb_id | weight
---------|---------|--------
1        | 1       | 100     -- Very common
1        | 2       | 50      -- Common
1        | 3       | 10      -- Rare
```

Selection algorithm:
```typescript
function selectWeightedHerb(biomeHerbs: BiomeHerb[]): Herb {
  const totalWeight = biomeHerbs.reduce((sum, bh) => sum + bh.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const bh of biomeHerbs) {
    random -= bh.weight
    if (random <= 0) {
      return bh.herb
    }
  }
  
  return biomeHerbs[biomeHerbs.length - 1].herb
}
```

---

## Brewing System

### Element Pool Building

When herbs are selected, their elements are pooled:

```typescript
function buildElementPool(herbs: Herb[]): ElementPool {
  const pool: Record<string, number> = {}
  
  for (const herb of herbs) {
    for (const element of herb.elements) {
      pool[element] = (pool[element] || 0) + 1
    }
  }
  
  return pool
}

// Example:
// Herbs: [{ elements: ['fire', 'water'] }, { elements: ['fire'] }]
// Pool: { fire: 2, water: 1 }
```

### Element Pairing

Users pair elements to create effects. Each pair maps to a recipe:

```typescript
// Pairing logic
function findRecipeForPair(elem1: string, elem2: string, recipes: Recipe[]): Recipe | null {
  // Order doesn't matter: fire+water = water+fire
  const pair = [elem1, elem2].sort()
  
  return recipes.find(r => {
    const recipeElements = [...r.elements].sort()
    return recipeElements[0] === pair[0] && recipeElements[1] === pair[1]
  })
}
```

### Potency Stacking

Same pairs stack, increasing potency:

```
fire+water → Healing Elixir (potency 1)
fire+water → Healing Elixir (potency 2)
fire+water → Healing Elixir (potency 3)
```

The `{n}` placeholder in descriptions gets replaced:

```typescript
function applyPotency(description: string, potency: number): string {
  return description.replace(/\{n\}/g, potency.toString())
}

// "Heals {n}d8 hit points" with potency 3
// → "Heals 3d8 hit points"
```

### Choice Variables

Some recipes have choices:

```
Description: "Choose a damage type: {fire|cold|lightning}. Deals {n}d6 {fire|cold|lightning} damage."
```

The brewing UI presents options and stores choices:

```typescript
interface BrewChoices {
  'fire|cold|lightning': 'fire'  // User chose fire
}

function applyChoices(description: string, choices: BrewChoices): string {
  return description.replace(/\{([^}]+)\}/g, (match, options) => {
    if (choices[options]) return choices[options]
    return match
  })
}
```

### Brewing Roll

**Note:** Brewing is now character-based. The `characterId` is required, and all herbalism data (herbs, brewed items, recipes) is stored in `character_*` tables.

```typescript
async function brew(
  characterId: string,  // Character ID, not user ID
  herbs: CharacterHerb[],
  pairings: Pairing[],
  choices: BrewChoices,
  modifier: number
): Promise<BrewResult> {
  const roll = rollD20()
  const total = roll + modifier
  const success = total >= 15  // Brewing DC

  if (success) {
    // Calculate final description with potency and choices
    const description = computeDescription(pairings, choices)

    // Save to character_brewed
    await addCharacterBrewedItem(characterId, {
      type: determineType(pairings),
      effects: pairings.map(p => p.recipe.name),
      choices,
      computed_description: description
    })
  }

  // Always consume herbs from character_herbs
  for (const herb of herbs) {
    await removeCharacterHerbs(characterId, herb.herb_id, 1)
  }

  return { success, roll, total }
}
```

---

## Recipe System

### Recipe Structure

```typescript
interface Recipe {
  id: number
  name: string
  elements: string[]        // The element pair [elem1, elem2]
  type: 'elixir' | 'bomb' | 'oil'
  description: string       // Effect description with {n} and choices
  recipe_text: string       // Flavor text for recipe book
  lore: string              // Background story
  is_secret: boolean        // Must be unlocked with code
  unlock_code: string | null // Code to unlock (if secret)
}
```

### Recipe Initialization

**Note:** Recipe knowledge is now character-based, stored in `character_recipes`.

New characters get base (non-secret) recipes:

```typescript
async function initializeBaseRecipes(characterId: string) {
  // Get all non-secret recipes
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id')
    .eq('is_secret', false)

  if (!recipes) return

  // Insert character_recipes entries
  const characterRecipes = recipes.map(r => ({
    character_id: characterId,
    recipe_id: r.id
  }))

  await supabase.from('character_recipes').insert(characterRecipes)
}
```

### Secret Recipe Unlocking

```typescript
async function unlockRecipeWithCode(
  characterId: string,  // Character ID, not user ID
  code: string
): Promise<{ recipe?: Recipe; error?: string }> {
  // Find recipe with matching code
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('unlock_code', code.toUpperCase())
    .single()

  if (!recipe) {
    return { error: 'Invalid unlock code' }
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('character_recipes')
    .select('id')
    .eq('character_id', characterId)
    .eq('recipe_id', recipe.id)
    .single()

  if (existing) {
    return { error: 'Recipe already unlocked' }
  }

  // Unlock it for this character
  await supabase.from('character_recipes').insert({
    character_id: characterId,
    recipe_id: recipe.id
  })

  return { recipe }
}
```

---

## State Management Patterns

### Context vs Local State

**Use Context when:**
- Data is needed across multiple pages
- Data represents user identity/settings
- Data needs to persist across navigation

**Use Local State when:**
- Data is page-specific (foraging results, brew selections)
- Data is ephemeral (loading states, form inputs)
- Data doesn't need to persist

### State Machine Pattern

Complex flows use explicit state phases:

```typescript
// Brewing page state machine
type BrewState =
  | { phase: 'select-herbs'; selectedHerbs: Map<number, number> }
  | { phase: 'pair-elements'; herbs: InventoryItem[]; pool: ElementPool }
  | { phase: 'make-choices'; pairings: Pairing[]; requiredChoices: string[] }
  | { phase: 'brewing'; brewData: BrewData }
  | { phase: 'result'; result: BrewResult }

function reducer(state: BrewState, action: BrewAction): BrewState {
  switch (action.type) {
    case 'SELECT_HERBS':
      return { phase: 'pair-elements', ... }
    case 'PAIR_ELEMENTS':
      return { phase: 'make-choices', ... }
    // etc
  }
}
```

### Optimistic Updates

Profile updates apply immediately, then sync:

```typescript
const updateProfile = async (updates: Partial<Profile>) => {
  // Optimistic: update state immediately
  setProfile(prev => prev ? { ...prev, ...updates } : null)
  
  // Background: sync to database
  const { error } = await updateProfileInDb(profileId, updates)
  
  if (error) {
    // Revert on failure (could be more sophisticated)
    console.error('Failed to update profile:', error)
  }
}
```

---

## Error Handling

### Error Display Component

```typescript
// src/components/ui/ErrorDisplay.tsx
export function ErrorDisplay({ 
  message, 
  onDismiss, 
  className 
}: ErrorDisplayProps) {
  if (!message) return null

  return (
    <div className={`bg-red-900/50 border border-red-500 rounded p-4 ${className}`}>
      <p className="text-red-200">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 underline mt-2">
          Dismiss
        </button>
      )}
    </div>
  )
}
```

### Error Boundaries

Currently, the app doesn't use React error boundaries. Recommended addition:

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

---

## Performance Considerations

### Current Optimizations

1. **React Query Caching:** All data fetching uses TanStack Query (`@/lib/hooks/queries.ts`)
   - Automatic caching across components
   - Request deduplication (same query = single request)
   - Configurable stale time (biomes: 30min, static data: infinite)
   - No refetch on tab switch

2. **Prefetching:** Data loads before navigation
   - `PrefetchLink` component prefetches on hover (100ms delay)
   - Home page prefetches common data on load
   - Near-instant navigation after initial load

3. **Skeleton Loading:** Instant perceived performance
   - Page structure shows immediately
   - Animated placeholders during data fetch
   - Per-page skeletons match actual layout

4. **Memoization:** Uses React.memo for expensive components

5. **Debounced Updates:** Profile saves are debounced

6. **Batched Inventory Operations:** `addHerbsToInventory` and `removeHerbsFromInventory` use:
   - Single SELECT with `IN` clause instead of N queries
   - Batch INSERT for new items
   - Chunked parallel UPDATEs (max 20 concurrent) to avoid rate limits
   - Configurable chunk sizes (`MAX_CONCURRENT_REQUESTS`, `MAX_IN_CLAUSE_SIZE`)

### React Query Architecture

```typescript
// Centralized in @/lib/hooks/queries.ts

// 1. Query Keys (for cache management)
export const queryKeys = {
  inventory: (profileId: string) => ['inventory', profileId],
  biomes: ['biomes'],
  // ...
}

// 2. Shared Fetchers (DRY - used by hooks and prefetch)
const fetchers = {
  inventory: async (profileId: string) => { /* ... */ },
  biomes: async () => { /* ... */ },
}

// 3. Hooks (used in components)
export function useInventory(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory(profileId ?? ''),
    queryFn: () => fetchers.inventory(profileId!),
    enabled: !!profileId,
  })
}

// 4. Prefetch (called on link hover)
export function usePrefetch() {
  const queryClient = useQueryClient()
  return {
    prefetchInventory: (profileId: string | null) => {
      if (!profileId) return
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory(profileId),
        queryFn: () => fetchers.inventory(profileId),
      })
    },
  }
}

// 5. Invalidation (after mutations)
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  return {
    invalidateInventory: (profileId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory(profileId) })
    },
  }
}
```

### Potential Future Improvements

1. **Virtual Lists:** For large inventories, use react-window
2. **Supabase Subscriptions:** Real-time updates instead of polling
3. **Image Optimization:** If herb images are added, use next/image
4. **Service Worker:** Offline support for reference data

### Bundle Size

Current dependencies:
- next, react, react-dom (core)
- @supabase/supabase-js (database)
- @tanstack/react-query (data fetching)
- tailwindcss (styling)

No animation libraries or heavy UI frameworks.

---

## Testing Strategy (Recommended)

Currently no tests. Recommended approach:

### Unit Tests
- Dice rolling functions
- Element pairing logic
- Description parsing

### Integration Tests
- Profile CRUD operations
- Inventory management
- Brewing flow

### E2E Tests
- Full foraging flow
- Complete brew from herb selection to result
- Recipe unlocking

---

*This document should be updated as the architecture evolves.*

