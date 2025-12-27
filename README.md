# 🌿 Herbalism Tool

A D&D homebrew companion app for a custom herbalism and alchemy system. Players can forage for herbs in different biomes, manage their inventory, and (if they're herbalists) brew elixirs, bombs, and weapon oils.

**Live URL:** Deployed on Netlify  
**Database:** Supabase (PostgreSQL)  
**Framework:** Next.js 16 with App Router  
**Styling:** Tailwind CSS v4  

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [Core Concepts](#core-concepts)
7. [Page-by-Page Breakdown](#page-by-page-breakdown)
8. [Component Library](#component-library)
9. [State Management](#state-management)
10. [Authentication Flow](#authentication-flow)
11. [Design Patterns](#design-patterns)
12. [Known Issues & Gotchas](#known-issues--gotchas)
13. [Making Changes](#making-changes)
14. [Glossary](#glossary)

---

## What This App Does

### The D&D Homebrew System

This app implements a custom tabletop RPG system where:

1. **Foraging**: Players spend "foraging sessions" (limited per day) to search biomes for herbs. Each session requires a Nature/Survival check (DC 13). Success yields random herbs weighted by biome.

2. **Herbs**: Each herb has one or more **elements** (fire, water, earth, air, positive, negative) and a rarity (common → preternatural).

3. **Brewing** (Herbalists only): Combine herbs to create consumables. Pair elements together to create effects. For example, fire+water might create a healing elixir.

4. **Recipes**: Each element pair maps to a recipe. Some recipes are secret and must be unlocked with codes.

5. **Products**: The result is an elixir (drink for beneficial effects), bomb (throw for damage), or oil (apply to weapons).

### User Types

- **Authenticated Users**: Email/password login required. Data syncs across devices.
- **Herbalists**: Characters with the Herbalist vocation can brew. Others can only forage.

**Note:** Guest mode has been removed. Users must create an account to use the app.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Next.js   │  │  React 19   │  │   Tailwind CSS v4       │ │
│  │  App Router │  │  (client)   │  │   (styling)             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────────────┐ │
│  │                    CONTEXTS                                │ │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐   │ │
│  │  │   AuthContext    │  │     ProfileContext          │   │ │
│  │  │  (user session)  │  │  (character data + sessions)│   │ │
│  │  └──────────────────┘  └─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────────────┐ │
│  │                 REACT QUERY LAYER                          │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  @/lib/hooks (queries.ts)                          │   │ │
│  │  │  • useInventory, useBrewedItems, useBiomes, etc.   │   │ │
│  │  │  • usePrefetch (link hover prefetching)            │   │ │
│  │  │  • useInvalidateQueries (cache management)         │   │ │
│  │  │  • Automatic caching & request deduplication       │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────────────┐ │
│  │                    LIB LAYER                               │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐│ │
│  │  │ profiles.ts│ │inventory.ts│ │ brewing.ts │ │recipes.ts││ │
│  │  │(CRUD ops)  │ │(CRUD ops)  │ │(logic+CRUD)│ │(CRUD)   ││ │
│  │  └────────────┘ └────────────┘ └────────────┘ └─────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌─────────────────┐  ┌────────────────────────────────────┐   │
│  │   Auth          │  │   PostgreSQL Database              │   │
│  │  (email/magic)  │  │   (profiles, herbs, recipes, etc.) │   │
│  └─────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **All Client Components**: The entire app is client-rendered (`'use client'`). No server components. This was chosen for simplicity with real-time Supabase updates.

2. **Auth Required**: Users must sign up to use the app. Profile ID is the authenticated user's `auth.uid()`.

3. **Optimistic UI**: Profile updates are optimistic (state updates immediately, then syncs to DB).

4. **Session Tracking in localStorage**: Foraging session usage (resets on long rest) is stored in localStorage, not the database.

5. **Expanding to Knights of Belyar**: The app is being expanded from a simple herbalism tool to a full character tracker for the Knights of Belyar homebrew system. See `docs/PLANNING-KNIGHTS.md` for the roadmap.

---

## Directory Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── brew/page.tsx          # Brewing interface (herbalists only)
│   ├── forage/page.tsx        # Foraging with biome selection
│   ├── inventory/page.tsx     # Herb and brewed item management
│   ├── login/page.tsx         # Authentication
│   ├── profile/page.tsx       # Character settings
│   ├── recipes/page.tsx       # Recipe book viewer
│   ├── page.tsx               # Home/dashboard
│   ├── layout.tsx             # Root layout with providers
│   ├── providers.tsx          # Context providers wrapper
│   └── globals.css            # Tailwind + global styles
│
├── components/                 # Reusable React components
│   ├── brew/                  # Brewing-specific components
│   │   ├── ChoicesPhase.tsx   # Effect variable selection
│   │   ├── HerbSelector.tsx   # Inventory selection UI
│   │   ├── PairingPhase.tsx   # Element pairing interface
│   │   ├── RecipeSelector.tsx # Recipe selection (by-recipe mode)
│   │   ├── ResultPhase.tsx    # Brew results display
│   │   └── index.ts           # Barrel export
│   │
│   ├── elements/              # Element display components
│   │   ├── ElementBadge.tsx   # Single element emoji
│   │   └── index.ts
│   │
│   ├── inventory/             # Inventory-specific components
│   │   ├── BrewedItemCard.tsx # Brewed item display
│   │   ├── ElementSummary.tsx # Element totals
│   │   ├── HerbRow.tsx        # Single herb row
│   │   └── index.ts
│   │
│   ├── recipes/               # Recipe display
│   │   ├── RecipeCard.tsx     # Recipe card with lore
│   │   └── index.ts
│   │
│   ├── ui/                    # Generic UI components
│   │   ├── ErrorDisplay.tsx   # Error message display
│   │   ├── LoadingState.tsx   # Loading indicators
│   │   ├── PageLayout.tsx     # Page wrapper + home link
│   │   ├── Skeleton.tsx       # Skeleton loading components
│   │   └── index.ts
│   │
│   └── PrefetchLink.tsx       # Smart link with data prefetching
│
└── lib/                       # Core logic and utilities
    ├── hooks/                 # React Query hooks (data fetching)
    │   ├── queries.ts         # All data hooks + prefetch + invalidate
    │   └── index.ts           # Barrel export
    │
    ├── auth.tsx               # AuthContext and useAuth hook
    ├── brewing.ts             # Brewing logic and DB operations
    ├── constants.ts           # Shared constants (elements, DCs, etc.)
    ├── dice.ts                # Dice rolling utilities
    ├── inventory.ts           # Inventory CRUD operations
    ├── profile.tsx            # ProfileContext and useProfile hook
    ├── profiles.ts            # Profile CRUD operations
    ├── recipes.ts             # Recipe CRUD and unlock logic
    ├── supabase.ts            # Supabase client initialization
    └── types.ts               # TypeScript type definitions
```

---

## Database Schema

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     profiles    │     │      herbs      │     │     biomes      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (uuid) PK    │     │ id (bigint) PK  │     │ id (bigint) PK  │
│ username        │     │ name            │     │ name            │
│ is_herbalist    │     │ rarity          │     │ description     │
│ foraging_mod    │     │ elements[]      │     └─────────────────┘
│ herbalism_mod   │     │ description     │              │
│ max_sessions    │     └─────────────────┘              │
│ created_at      │              │                       │
└─────────────────┘              │                       │
        │                        ▼                       ▼
        │               ┌─────────────────────────────────┐
        │               │         biome_herbs             │
        │               ├─────────────────────────────────┤
        │               │ id (bigint) PK                  │
        │               │ biome_id FK → biomes            │
        │               │ herb_id FK → herbs              │
        │               │ weight (decimal)                │
        │               └─────────────────────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  user_inventory │     │   user_brewed   │     │   user_recipes  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (bigint) PK  │     │ id (bigint) PK  │     │ id (bigint) PK  │
│ user_id FK      │     │ user_id FK      │     │ user_id FK      │
│ herb_id FK      │     │ type            │     │ recipe_id FK    │
│ quantity        │     │ effects[]       │     └─────────────────┘
└─────────────────┘     │ quantity        │              │
                        │ choices (jsonb) │              │
                        │ computed_desc   │              ▼
                        │ created_at      │     ┌─────────────────┐
                        └─────────────────┘     │     recipes     │
                                                ├─────────────────┤
                                                │ id (bigint) PK  │
                                                │ name            │
                                                │ elements[]      │
                                                │ type            │
                                                │ description     │
                                                │ recipe_text     │
                                                │ lore            │
                                                │ is_secret       │
                                                │ unlock_code     │
                                                └─────────────────┘
```

### Field Mapping Gotcha ⚠️

The database uses different field names than the app:

| App Field | Database Column | Notes |
|-----------|-----------------|-------|
| `profile.name` | `username` | Historical naming |
| `profile.brewingModifier` | `herbalism_modifier` | Confusing but works |
| `profile.foragingModifier` | `foraging_modifier` | Matches |

This mapping is handled in `src/lib/profiles.ts`.

### RLS Status

**⚠️ Row Level Security is currently OFF on all tables.** This needs to be configured before production. Recommended policies:

```sql
-- Example: users can only see/modify their own inventory
CREATE POLICY "Users can view own inventory" ON user_inventory
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Core Concepts

### Elements

The six elements are the building blocks of the system:

| Element | Symbol | Color Theme |
|---------|--------|-------------|
| Fire | 🔥 | Red |
| Water | 💧 | Blue |
| Earth | ⛰️ | Green |
| Air | 💨 | Gray/White |
| Positive | ✨ | Yellow/Gold |
| Negative | 💀 | Purple |

### Rarity Tiers

```
common → uncommon → rare → very rare → legendary → preternatural
```

Higher rarity herbs are rarer in biomes and often have more/better elements.

### Foraging Flow

```
1. Player allocates sessions to biomes
2. For each session:
   a. Roll d20 + foraging modifier
   b. If ≥ DC 13: Success
      - Roll on quantity table (d20 → 1-6 herbs, nat 20 = roll twice)
      - For each herb, weighted random from biome's herb table
   c. If < DC 13: Failure, no herbs
3. All herbs added to inventory
```

### Brewing Flow

Two modes:

**By Herbs Mode:**
```
1. Select herbs from inventory (max 6)
2. View element pool (sum of all elements from herbs)
3. Pair elements together to create effects
   - Each pair maps to a recipe (e.g., fire+water = Healing Elixir)
   - Same type pairs add potency (fire+water twice = Healing Elixir ×2)
4. Make any required choices (some effects have options)
5. Roll d20 + brewing modifier vs DC 15
6. Success: Item created, added to brewed inventory
7. Failure: Herbs consumed, nothing created
```

**By Recipe Mode:**
```
1. Select desired recipes from recipe book
2. Set batch count (make multiple identical brews)
3. Select herbs that provide required elements
4. Make choices, roll for each batch item
```

### Potency

When the same effect is created multiple times, it stacks. Recipe descriptions use `{n}` as a placeholder:

```
Description: "Heals {n}d8 hit points"
With potency 3: "Heals 3d8 hit points"
```

---

## Page-by-Page Breakdown

### Home (`/`)

Simple dashboard with navigation cards. Shows:
- Profile summary (if name set)
- Auth status (signed in user email)
- Links to Forage, Inventory, Brew (if herbalist), Recipes

**Note:** Redirects to `/login` if not authenticated.

### Forage (`/forage`)

**Purpose:** Spend foraging sessions to find herbs.

**Key Features:**
- Session counter with long rest button
- Multi-biome allocation (distribute sessions across biomes)
- Rolling animation with results
- Individual herb removal (for giving to other players)

**State Machine:**
```
setup → rolling → results → (reset to setup)
```

### Inventory (`/inventory`)

**Purpose:** View and manage herbs and brewed items.

**Key Features:**
- Two tabs: Herbs and Brewed
- Herbs grouped by element or rarity
- Search with relevance scoring
- Delete individual herbs or all of type
- Expend brewed items (mark as used)

### Brew (`/brew`)

**Purpose:** Create elixirs, bombs, and oils.

**Herbalists Only:** Non-herbalists see a message to update their profile.

**Key Features:**
- Two modes: By Herbs and By Recipe
- Element pairing with recipe preview
- Variable choices for customizable effects
- Batch brewing (make multiple at once)
- Browser back button works within flow

**State Machine (By Herbs):**
```
select-herbs → pair-elements → make-choices → brewing → result
```

**State Machine (By Recipe):**
```
select-recipes → select-herbs-for-recipes → make-choices → brewing → result/batch-result
```

### Recipes (`/recipes`)

**Purpose:** View known recipes and unlock secrets.

**Key Features:**
- Tabs for Elixirs, Bombs, Oils
- Recipe cards with effect descriptions and lore
- Secret recipe unlock modal with code input

### Profile (`/profile`)

**Purpose:** Configure character settings.

**Fields:**
- Character name
- Herbalist toggle (enables brewing)
- Max foraging sessions/day
- Foraging modifier
- Brewing modifier (herbalists only)

### Login (`/login`)

**Purpose:** Authentication.

**Methods:**
- Email/password
- Magic link (passwordless)
- Account creation

---

## Component Library

### UI Components (`@/components/ui`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `PageLayout` | Wrapper with consistent padding, max-width, home link | `children`, `showHomeLink?`, `maxWidth?` |
| `LoadingState` | Full-page loading indicator | `message?` |
| `ErrorDisplay` | Error message box | `message`, `onDismiss?`, `className?` |
| `HomeLink` | Back to home link | (none) |
| `PrefetchLink` | Smart link with data prefetching on hover | `href`, `prefetch`, `profileId?`, `userId?` |
| `Skeleton` | Animated loading placeholder | `className?` |
| `InventorySkeleton` | Full page skeleton for inventory | (none) |
| `ForageSkeleton` | Full page skeleton for forage | (none) |
| `BrewSkeleton` | Full page skeleton for brew | (none) |
| `RecipesSkeleton` | Full page skeleton for recipes | (none) |
| `ProfileSkeleton` | Full page skeleton for profile | (none) |

### Element Components (`@/components/elements`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `ElementBadge` | Single element emoji with optional background | `element`, `showBackground?`, `size?` |
| `ElementList` | Multiple element badges in a row | `elements`, `showBackground?`, `size?`, `gap?` |

### Constants (`@/lib/constants`)

All element symbols, colors, game constants, and utility functions are centralized here:

```typescript
import { 
  ELEMENT_SYMBOLS,      // { fire: '🔥', water: '💧', ... }
  ELEMENT_COLORS,       // { fire: { bg, border, text, ... }, ... }
  RARITY_ORDER,         // ['common', 'uncommon', ...]
  FORAGING_DC,          // 13
  BREWING_DC,           // 15
  MAX_HERBS_PER_BREW,   // 6
  getElementSymbol,     // (element) => emoji
  getElementColors,     // (element) => color scheme
  getPrimaryElement,    // (elements[]) => dominant element
  getRarityIndex,       // (rarity) => sort index
} from '@/lib/constants'
```

---

## State Management

### Contexts

**AuthContext** (`src/lib/auth.tsx`)
- Manages Supabase auth session
- Provides `user`, `session`, `isLoading`
- Methods: `signIn`, `signUp`, `signInWithMagicLink`, `signOut`

**ProfileContext** (`src/lib/profile.tsx`)
- Manages character profile data
- Provides `profile`, `profileId`, `isLoaded`, `loadError`
- Tracks `sessionsUsedToday` (in localStorage)
- Methods: `updateProfile`, `spendForagingSessions`, `longRest`

### React Query Hooks (`@/lib/hooks`)

Data fetching uses TanStack Query (React Query) for automatic caching:

```typescript
import { 
  useInventory,        // Fetch herb inventory
  useBrewedItems,      // Fetch brewed items
  useBiomes,           // Fetch biomes (static data)
  useUserRecipes,      // Fetch known recipes
  usePrefetch,         // Prefetch data on hover
  useInvalidateQueries // Invalidate cache after mutations
} from '@/lib/hooks'

// Usage in components
const { data: inventory, isLoading, error } = useInventory(profileId)
const { prefetchInventory, prefetchRecipes } = usePrefetch()
const { invalidateInventory } = useInvalidateQueries()
```

**Benefits:**
- Automatic caching across components
- No refetch on tab switch (configurable)
- Request deduplication
- Built-in loading/error states
- Prefetching on link hover for instant navigation

### Data Flow

```
User Action
    │
    ▼
Page Component
    │
    ├─► React Query Hooks (data fetching + caching)
    │       │
    │       ▼
    │   lib/*.ts (database operations)
    │       │
    │       ▼
    │   Supabase
    │
    ├─► Context (for shared state like profile)
    │
    └─► Skeleton Loading (instant perceived load)
```

### Local Storage Keys

| Key | Purpose |
|-----|---------|
| `herbalism-sessions-used` | Foraging sessions used today |

---

## Authentication Flow

```
┌─────────────────┐
│  App Loads      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    Yes    ┌─────────────────┐
│ Auth session?   │──────────►│ Use auth.uid()  │
└────────┬────────┘           │ as profile ID   │
         │ No                 └────────┬────────┘
         ▼                             │
┌─────────────────┐                    ▼
│ Redirect to     │           ┌─────────────────┐
│ /login          │           │ Load/create     │
└─────────────────┘           │ profile         │
                              └─────────────────┘
```

### On Sign In

1. User authenticates with Supabase
2. `getOrCreateProfile(user.id)` is called
3. If no profile exists for that user ID, one is created
4. Base recipes are initialized

### On Sign Out

1. `signOut()` clears Supabase session
2. User is redirected to `/login`

---

## Design Patterns

### 1. Barrel Exports

Each component folder has an `index.ts`:

```typescript
// src/components/brew/index.ts
export { HerbSelector } from './HerbSelector'
export { PairingPhase } from './PairingPhase'
// ...
```

Import like:
```typescript
import { HerbSelector, PairingPhase } from '@/components/brew'
```

### 2. Colocation

Related components live together:
- `components/brew/` - All brewing-related components
- `components/inventory/` - All inventory-related components

### 3. Prop Drilling for Flexibility

Components receive callbacks as props rather than using contexts directly. This makes them more reusable and testable.

### 4. Error Return Pattern

All database operations return `{ data?, error: string | null }`:

```typescript
const { items, error } = await getInventory(userId)
if (error) {
  setError(error)
  return
}
// Use items
```

### 5. Optimistic Updates

Profile changes update local state immediately, then sync to DB:

```typescript
const updateProfileHandler = async (updates) => {
  setProfile(prev => ({ ...prev, ...updates }))  // Immediate
  await updateProfile(profileId, updates)         // Background sync
}
```

### 6. State Machines for Multi-Step Flows

Complex flows use discriminated unions:

```typescript
type BrewPhase = 
  | { phase: 'select-herbs' }
  | { phase: 'pair-elements'; selectedHerbs: InventoryItem[] }
  | { phase: 'result'; success: boolean; roll: number; /* ... */ }
```

### 7. React Query for Data Fetching

All data fetching uses React Query hooks with shared fetchers:

```typescript
// In @/lib/hooks/queries.ts
const fetchers = {
  inventory: async (profileId: string) => { /* ... */ },
  biomes: async () => { /* ... */ },
}

export function useInventory(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory(profileId ?? ''),
    queryFn: () => fetchers.inventory(profileId!),
    enabled: !!profileId,
  })
}
```

### 8. Prefetching on Hover

Links prefetch data for instant navigation:

```tsx
<PrefetchLink href="/inventory" prefetch="inventory" profileId={profileId}>
  View Inventory
</PrefetchLink>
```

### 9. Skeleton Loading

Pages show structure immediately while data loads:

```tsx
if (isLoading) {
  return <InventorySkeleton />  // Shows animated page structure
}
```

---

## Known Issues & Gotchas

### 1. Field Name Mismatch

The app uses `brewingModifier` but the database column is `herbalism_modifier`. This is documented but confusing. The mapping is in `src/lib/profiles.ts`.

### 2. RLS Not Enabled

Row Level Security is OFF. Anyone with the anon key could technically access any user's data. Configure RLS before production.

### 3. Type Casting for Supabase Joins

When fetching joined data, we cast `as unknown as Type`:

```typescript
herb: row.herbs as unknown as Herb
```

This is because Supabase types don't perfectly match our app types. Consider generating types with `supabase gen types typescript`.

### 4. Session Storage in localStorage

`sessionsUsedToday` resets if localStorage is cleared or user switches browsers. This is by design (sessions reset on long rest), but could be surprising.

### 5. Browser Back Button in Brew

Custom `popstate` handling keeps users in the brew flow. This is helpful but could be confusing if users expect normal browser behavior.

### 6. Effects Array Can Be String or Array

The `user_brewed.effects` column stores a PostgreSQL array, but when retrieved it sometimes comes as a string. Components handle both cases.

### 7. Deprecated Function in brewing.ts

`fetchRecipes()` is marked deprecated. Use `fetchUserRecipes(userId)` instead, which only returns recipes the user knows.

---

## Making Changes

### Adding a New Element

1. Update `ELEMENT_SYMBOLS` in `src/lib/constants.ts`
2. Update `ELEMENT_COLORS` in `src/lib/constants.ts`
3. Update `ELEMENT_ORDER` in `src/lib/constants.ts`
4. Add herbs with the new element to the database

### Adding a New Recipe Type

1. Update `RecipeType` in `src/lib/types.ts`
2. Update `RECIPE_TYPES` in `src/lib/constants.ts`
3. Add styling for the new type in:
   - `src/components/recipes/RecipeCard.tsx`
   - `src/components/inventory/BrewedItemCard.tsx`
   - `src/components/brew/RecipeSelector.tsx`
4. Add tab in `src/app/recipes/page.tsx`
5. Add filter button in `src/app/inventory/page.tsx`

### Adding a New Page

1. Create `src/app/your-page/page.tsx`
2. Use `PageLayout` wrapper
3. Add navigation link to home page

### Adding a New Component

1. Create in appropriate folder under `src/components/`
2. Add JSDoc comment explaining purpose
3. Export from folder's `index.ts`
4. Import from barrel: `import { YourComponent } from '@/components/folder'`

### Adding a New Data Hook

1. Add fetcher function to `src/lib/hooks/queries.ts`:
   ```typescript
   const fetchers = {
     newData: async (id: string) => {
       const result = await fetchNewData(id)
       if (result.error) throw new Error(result.error)
       return result.data
     },
   }
   ```

2. Add query key:
   ```typescript
   export const queryKeys = {
     newData: (id: string) => ['newData', id] as const,
   }
   ```

3. Add hook:
   ```typescript
   export function useNewData(id: string | null) {
     return useQuery({
       queryKey: queryKeys.newData(id ?? ''),
       queryFn: () => fetchers.newData(id!),
       enabled: !!id,
     })
   }
   ```

4. (Optional) Add prefetch function:
   ```typescript
   prefetchNewData: (id: string | null) => {
     if (!id) return
     queryClient.prefetchQuery({
       queryKey: queryKeys.newData(id),
       queryFn: () => fetchers.newData(id),
     })
   }
   ```

5. (Optional) Add skeleton in `src/components/ui/Skeleton.tsx`

### Modifying Database Schema

1. Update types in `src/lib/types.ts`
2. Update any mapping functions (e.g., `mapDatabaseToProfile`)
3. Update CRUD functions in relevant `lib/*.ts` file
4. Consider generating types: `npx supabase gen types typescript`

---

## Glossary

| Term | Definition |
|------|------------|
| **Biome** | A location type (forest, swamp, etc.) where specific herbs grow |
| **Element** | One of six magical properties: fire, water, earth, air, positive, negative |
| **Elixir** | A drinkable potion with beneficial effects |
| **Bomb** | A throwable explosive with damaging effects |
| **Oil** | A weapon coating that adds effects to attacks |
| **Foraging Session** | A 1-hour period spent searching for herbs |
| **Long Rest** | D&D term for sleeping; resets foraging sessions |
| **Potency** | How many times an effect is stacked (affects magnitude) |
| **DC** | Difficulty Class; the target number to beat on a d20 roll |
| **Recipe** | A formula mapping element pairs to effects |
| **Secret Recipe** | A recipe that must be unlocked with a code |

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Supabase CLI

This project includes the Supabase CLI for database management. See `docs/SUPABASE-CLI.md` for full documentation.

### Quick Setup

1. Generate an access token at https://supabase.com/dashboard/account/tokens
2. Add to `.env.local`: `SUPABASE_ACCESS_TOKEN=sbp_your_token_here`
3. Link the project: `npx supabase link --project-ref cliiijgqzwkiknukfgqc`

### Database Commands

```bash
npm run db:status   # Show database info
npm run db:pull     # Pull remote schema to migrations
npm run db:push     # Push migrations to remote
npm run db:diff     # Generate migration from changes
npm run db:types    # Generate TypeScript types
npm run supabase    # Run any supabase command
```

### Generated Types

Run `npm run db:types` to generate `src/lib/database.types.ts` with full TypeScript types for all tables.

### For AI Agents

Agents can query the database directly:

```bash
npx supabase db execute --sql "SELECT * FROM profiles LIMIT 5"
npx supabase inspect db table-stats
```

See `docs/SUPABASE-CLI.md` for complete documentation including troubleshooting.

---

## Contact & History

**Original Development:** Built as a D&D homebrew companion tool.

**Major Refactor (Dec 2024):** Codebase cleanup including:
- Extracted shared constants and components
- Reduced brew page from 1935 → 560 lines
- Added comprehensive documentation
- Renamed `guest.ts` → `profiles.ts`
- Fixed type inconsistencies

---

*Last updated: December 2024*

---

## Recent Changes (Dec 2024)

### Performance & Data Fetching
- **React Query Integration:** All data fetching now uses TanStack Query for automatic caching, request deduplication, and smart refetching
- **Prefetching:** Links prefetch data on hover for near-instant navigation
- **Skeleton Loading:** Pages show animated structure immediately while data loads
- **No Tab-Switch Reload:** Data persists when switching browser tabs

### Code Organization
- **Centralized Hooks:** All data hooks in `@/lib/hooks/queries.ts`
- **Shared Fetchers:** DRY pattern prevents code duplication between hooks and prefetch
- **Barrel Exports:** Clean imports via `@/lib/hooks` and `@/components/ui`

