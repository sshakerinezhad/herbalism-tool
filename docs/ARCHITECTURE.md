# Architecture

Technical overview of the herbalism-tool codebase — system design, data flows, and the reasoning behind key decisions.

---

## System Overview

D&D homebrew companion: character tracking, foraging, brewing, equipment management. All client-rendered React with Supabase backend.

### Why Client-Side Rendering?

All pages use `'use client'`. Rationale:
1. **Real-time state** — inventory, brewing, and session data change frequently
2. **Supabase client SDK** — works naturally in browser context
3. **No SEO needed** — this is an app, not content
4. **Simpler mental model** — no server/client boundary confusion

**Trade-off:** Slightly slower initial load, no pre-rendering benefits.

### Provider Hierarchy

```tsx
// src/app/providers.tsx
<QueryClientProvider>
  <AuthProvider>
    <ProfileProvider>
      {children}
    </ProfileProvider>
  </AuthProvider>
</QueryClientProvider>
```

ProfileProvider depends on AuthProvider because profile loading requires `user?.id`. QueryClientProvider wraps everything for React Query caching.

---

## Module Dependency Graph

```
Pages (src/app/*/page.tsx)
  ├── components/*           UI components
  ├── lib/hooks/             React Query hooks (DATA LAYER)
  │     ├── queries.ts       All data hooks, prefetch, invalidation
  │     └── useBrewState.ts  Brewing state machine
  ├── lib/db/                Database operations
  │     ├── characters.ts    Character CRUD + equipment ops
  │     ├── characterInventory.ts  Herb/brewed/recipe ops
  │     └── biomes.ts        Biome data
  ├── lib/brewing.ts         Brewing logic (element pools, pairing)
  ├── lib/dice.ts            Dice utilities
  ├── lib/constants.ts       Game constants
  ├── lib/types.ts           Type definitions
  └── lib/supabase.ts        Database client (leaf node)
```

**Rules:**
- Pages use `@/lib/hooks` for data fetching — never call `lib/db/` directly from components
- Components import from `lib/` but not other pages
- `lib/hooks` imports from `lib/db/` for actual DB operations
- `supabase.ts` is the leaf — imports nothing from app code

---

## Data Flow

```
User navigates to page
         │
         ▼
    useXxx hook (from @/lib/hooks)
         │
         ├── Cache hit? → Return cached data immediately
         │
         └── Cache miss? → Call fetcher
                              │
                              ▼
                         lib/db/*.ts (DB operations)
                              │
                              ▼
                         Supabase (PostgreSQL)
                              │
                              ▼
                    Cache result, return to component
```

After mutations, call the corresponding `invalidateXxx()` from `useInvalidateQueries()` to refresh cached data.

---

## Authentication

Auth is required — no guest mode. Unauthenticated users redirect to `/login`.

Flow: `supabase.auth.getSession()` on load → listen for `onAuthStateChange` → set user/session in AuthContext.

The profile system uses `user.id` (from `auth.uid()`) to look up or create a profile row.

**Field mapping quirk:** `brewingModifier` in app code maps to `herbalism_modifier` in the database. Historical naming mismatch.

---

## Character System

All game data is character-based (not user-based). One user has one character.

**Character creation** (`/create-character`): wizard flow collecting race, class, background, order, ability scores, vocation.

**Character data hierarchy:**
```
character
  ├── character_skills (26 skill proficiencies)
  ├── character_armor (equipped armor pieces)
  ├── character_weapons (owned weapons)
  ├── character_items (general inventory)
  ├── character_weapon_slots (6 slots: 3 per hand)
  ├── character_quick_slots (6 combat quick-access slots)
  ├── character_herbs (foraged herbs)
  ├── character_brewed (crafted items)
  └── character_recipes (known recipes)
```

DB operations for characters live in `src/lib/db/characters.ts` (50+ functions) and `src/lib/db/characterInventory.ts`.

---

## Foraging System

**Core algorithm:**
1. Player spends foraging sessions (tracked in localStorage, scoped to user ID)
2. Each session: roll d20 + modifier vs DC 13
3. Natural 20 = roll twice on herb table; Natural 1 = auto-fail
4. On success, roll for quantity (d20 → 1-5 herbs based on tier)
5. Herb selection uses weighted random from `biome_herbs` table

**Quantity table:**

| d20 Roll | Herbs Found |
|----------|-------------|
| 1-5 | 1 |
| 6-10 | 2 |
| 11-15 | 3 |
| 16-18 | 4 |
| 19 | 5 |
| 20 | Roll twice |

---

## Brewing System

**Phases:** Select herbs → Pair elements → Make choices → Roll → Result

1. **Element pool:** Each herb contributes its elements. Pool tracks element counts.
2. **Pairing:** User pairs elements to match recipes. Order doesn't matter (fire+water = water+fire).
3. **Potency stacking:** Same pair repeated increases potency. `{n}` in descriptions becomes the potency count.
4. **Choice variables:** Some recipes have choices like `{fire|cold|lightning}`. UI presents options.
5. **Brewing roll:** d20 + modifier vs DC 15. Success saves to `character_brewed`; herbs are always consumed.

State management for the brew flow lives in `src/lib/hooks/useBrewState.ts`.

---

## React Query Architecture

All data fetching is centralized in `src/lib/hooks/queries.ts`. The pattern:

1. **Query keys** — unique cache identifiers per data type + ID
2. **Fetchers** — async functions calling `lib/db/` operations (shared by hooks and prefetch)
3. **Hooks** — `useXxx(id)` wrappers with `enabled: !!id` guard
4. **Invalidation** — `useInvalidateQueries()` returns helpers like `invalidateCharacterHerbs(characterId)`
5. **Prefetch** — `usePrefetch()` returns helpers for hover-prefetching via `PrefetchLink`

**Cache config:** Biomes/reference data use long stale times (30min+). Character data refetches more aggressively. No refetch on tab switch.

---

## Performance

1. **React Query caching** — request deduplication, automatic caching across components
2. **Prefetching** — `PrefetchLink` prefetches data on hover (100ms delay)
3. **Skeleton loading** — per-page skeletons for instant perceived performance
4. **Batched DB operations** — inventory ops use `IN` clauses and chunked parallel updates
5. **Memoization** — `useMemo` for expensive computations in brew state

---

## Error Handling

All DB operations return `{ data?, error: string | null }`. Components display errors via `<ErrorDisplay>`. Actual errors logged to console; user-facing messages are generic.

No React error boundaries currently implemented.

---

*Update this document as the architecture evolves.*

*Last updated: March 2026*
