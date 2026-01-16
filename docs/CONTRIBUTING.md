# Contributing Guide

This document covers coding standards, patterns, and practices for working on the herbalism-tool codebase.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Code Style](#code-style)
3. [File Organization](#file-organization)
4. [Component Patterns](#component-patterns)
5. [Database Operations](#database-operations)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Common Tasks](#common-tasks)
9. [Pull Request Checklist](#pull-request-checklist)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (for database)

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://cliiijgqzwkiknukfgqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Check for linting errors
```

---

## Code Style

### TypeScript

- **Strict mode:** Enabled in tsconfig
- **No `any`:** Use proper types or `unknown`
- **Interfaces over types:** Prefer `interface` for objects
- **Explicit return types:** For exported functions

```typescript
// Good
export function getInventory(userId: string): Promise<InventoryResult> {
  // ...
}

// Bad
export function getInventory(userId: any) {
  // ...
}
```

### Imports

Order imports consistently:

```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { supabase } from '@/lib/supabase'

// 3. Internal hooks
import { useInventory, useInvalidateQueries } from '@/lib/hooks'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'

// 4. Internal components
import { PageLayout, InventorySkeleton, PrefetchLink } from '@/components/ui'
import { ElementBadge } from '@/components/elements'

// 5. Types
import type { Herb, Recipe } from '@/lib/types'

// 6. Constants
import { ELEMENT_SYMBOLS, FORAGING_DC } from '@/lib/constants'
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HerbSelector`, `ElementBadge` |
| Functions | camelCase | `getInventory`, `rollDice` |
| Constants | SCREAMING_SNAKE | `FORAGING_DC`, `ELEMENT_SYMBOLS` |
| Types/Interfaces | PascalCase | `Profile`, `BrewResult` |
| Files | kebab-case or PascalCase | `ElementBadge.tsx`, `constants.ts` |
| Folders | kebab-case | `components/ui`, `components/brew` |

---

## File Organization

### Components

```
src/components/
├── brew/                 # Feature-specific components
│   ├── HerbSelector.tsx
│   ├── PairingPhase.tsx
│   └── index.ts          # Barrel export
│
├── ui/                   # Generic, reusable components
│   ├── PageLayout.tsx
│   ├── LoadingState.tsx
│   └── index.ts
│
└── elements/             # Domain-specific but reusable
    ├── ElementBadge.tsx
    └── index.ts
```

### Library Code

```
src/lib/
├── hooks/                # React Query hooks (DATA LAYER)
│   ├── queries.ts        # All data hooks, prefetch, invalidation
│   └── index.ts          # Barrel export
│
├── auth.tsx              # AuthContext + AuthProvider
├── profile.tsx           # ProfileContext + ProfileProvider
├── supabase.ts           # Database client
├── types.ts              # Shared type definitions
├── constants.ts          # Shared constants
├── profiles.ts           # Profile CRUD operations
├── inventory.ts          # Inventory CRUD operations
├── brewing.ts            # Brewing logic + operations
├── recipes.ts            # Recipe operations
└── dice.ts               # Dice utilities
```

### Pages

Each page is a single file under `src/app/`:

```
src/app/
├── page.tsx              # Home (/)
├── login/page.tsx        # Auth (/login)
├── profile/page.tsx      # Settings (/profile)
├── forage/page.tsx       # Foraging (/forage)
├── inventory/page.tsx    # Inventory (/inventory)
├── brew/page.tsx         # Brewing (/brew)
└── recipes/page.tsx      # Recipe book (/recipes)
```

---

## Component Patterns

### Page Component Structure (with React Query)

```tsx
'use client'

import { PageLayout, ErrorDisplay, PageNameSkeleton } from '@/components/ui'
import { useProfile } from '@/lib/profile'
import { useSomeData, useInvalidateQueries } from '@/lib/hooks'

export default function PageName() {
  // 1. Context hooks
  const { profile, profileId, isLoaded } = useProfile()
  const { invalidateSomeData } = useInvalidateQueries()
  
  // 2. React Query hooks (handles loading, caching, errors)
  const { 
    data = [], 
    isLoading, 
    error 
  } = useSomeData(profileId)
  
  // 3. Local UI state only
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  
  // 4. Event handlers (with cache invalidation)
  const handleSomething = async () => {
    setMutationError(null)
    const { error } = await someMutation(profileId, data)
    if (error) {
      setMutationError(error)
    } else {
      invalidateSomeData(profileId) // Refresh cached data
    }
  }
  
  // 5. Loading state (use skeleton for better UX)
  if (!isLoaded || isLoading) {
    return <PageNameSkeleton />
  }
  
  // 6. Render
  return (
    <PageLayout>
      <ErrorDisplay 
        message={error?.message || mutationError} 
        onDismiss={() => setMutationError(null)} 
      />
      {/* Page content */}
    </PageLayout>
  )
}
```

### Reusable Component Structure

```tsx
import { type ReactNode } from 'react'
import { ELEMENT_SYMBOLS } from '@/lib/constants'

interface ComponentNameProps {
  /** Primary data to display */
  element: string
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional click handler */
  onClick?: () => void
  /** Child elements */
  children?: ReactNode
}

/**
 * Brief description of what this component does.
 * 
 * @example
 * <ComponentName element="fire" size="lg" />
 */
export function ComponentName({ 
  element, 
  size = 'md', 
  onClick,
  children 
}: ComponentNameProps) {
  const symbol = ELEMENT_SYMBOLS[element] || element
  
  return (
    <div 
      className={`element-badge element-badge-${size}`}
      onClick={onClick}
    >
      {symbol}
      {children}
    </div>
  )
}
```

### Barrel Exports

Every component folder should have an `index.ts`:

```typescript
// src/components/brew/index.ts
export { HerbSelector } from './HerbSelector'
export { PairingPhase } from './PairingPhase'
export { ChoicesPhase } from './ChoicesPhase'
export { ResultPhase } from './ResultPhase'
export { RecipeSelector } from './RecipeSelector'
```

This enables clean imports:

```typescript
import { HerbSelector, PairingPhase } from '@/components/brew'
```

---

## Database Operations

**Important:** All herbalism data is character-based. Use `character_herbs`, `character_brewed`, and `character_recipes` tables (not the legacy `user_*` tables).

### Return Pattern

All database operations return `{ data?, error }`:

```typescript
export async function getCharacterHerbs(characterId: string): Promise<{
  items?: CharacterHerb[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('character_herbs')
      .select('*, herbs(*)')
      .eq('character_id', characterId)

    if (error) throw error

    const items = (data || []).map(row => ({
      id: row.id,
      character_id: row.character_id,
      herb_id: row.herb_id,
      herb: row.herbs as unknown as Herb,
      quantity: row.quantity
    }))

    return { items, error: null }
  } catch (err) {
    console.error('getCharacterHerbs failed:', err)
    return { error: 'Failed to load herbs' }
  }
}
```

### Error Messages

- User-facing error messages should be helpful but not expose internals
- Always log the actual error to console for debugging

```typescript
// Good
return { error: 'Failed to save changes. Please try again.' }

// Bad
return { error: error.message } // Might expose SQL errors
```

### Upserts

For operations that should create or update:

```typescript
const { error } = await supabase
  .from('character_herbs')
  .upsert(
    { character_id: characterId, herb_id: herbId, quantity: newQuantity },
    { onConflict: 'character_id,herb_id' }
  )
```

---

## State Management

### State Management Decision Tree

| Data Type | Where to Store |
|-----------|----------------|
| Server data (inventory, recipes, etc.) | **React Query hooks** (`@/lib/hooks`) |
| User authentication | **AuthContext** |
| User profile/settings | **ProfileContext** |
| Cross-page data | **Context** |
| Form inputs | **Local useState** |
| UI state (selections, modals) | **Local useState** |

### When to Use Context

| Use Context | Use Local State |
|-------------|-----------------|
| User authentication | Form inputs |
| User profile/settings | Loading indicators |
| Cross-page data | Page-specific selections |

### Context Pattern

```typescript
// 1. Create context
const MyContext = createContext<MyContextType | null>(null)

// 2. Create hook for consuming
export function useMyContext() {
  const context = useContext(MyContext)
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider')
  }
  return context
}

// 3. Create provider
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial)
  
  const value = useMemo(() => ({
    state,
    setState
  }), [state])
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  )
}
```

### Optimistic Updates

For responsive UI, update state before the database call completes:

```typescript
const updateProfile = async (updates: Partial<Profile>) => {
  // Optimistic update
  setProfile(prev => ({ ...prev, ...updates }))
  
  // Sync to database
  const { error } = await updateProfileInDb(profileId, updates)
  
  if (error) {
    // Could revert here, but currently we just log
    console.error('Update failed:', error)
  }
}
```

---

## Error Handling

### Component Level

```tsx
function MyComponent() {
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    setError(null) // Clear previous error
    
    const { error } = await someOperation()
    
    if (error) {
      setError(error)
      return
    }
    
    // Success path
  }

  return (
    <>
      <ErrorDisplay message={error} onDismiss={() => setError(null)} />
      {/* Rest of component */}
    </>
  )
}
```

### Async Operations

```typescript
// Use try/catch for unexpected errors
try {
  const { data, error } = await supabase.from('table').select()
  
  if (error) {
    // Expected Supabase error
    return { error: error.message }
  }
  
  return { data, error: null }
} catch (err) {
  // Unexpected error (network, etc.)
  console.error('Unexpected error:', err)
  return { error: 'Something went wrong' }
}
```

---

## Common Tasks

### Adding a New Page

1. Create `src/app/your-page/page.tsx`
2. Use `'use client'` directive
3. Wrap content in `<PageLayout>`
4. Add link from home page or navigation

### Adding a New Component

1. Determine folder: `ui/` (generic), or feature folder (`brew/`, etc.)
2. Create `ComponentName.tsx`
3. Add JSDoc comment with description
4. Export from folder's `index.ts`

### Adding a New Database Operation

1. Add function to appropriate `lib/*.ts` file
2. Use standard return pattern: `{ data?, error }`
3. Add TypeScript types for inputs/outputs
4. Log errors to console

### Adding a New React Query Hook

Add to `src/lib/hooks/queries.ts`:

```typescript
// 1. Add fetcher function
const fetchers = {
  // ... existing fetchers
  
  newData: async (id: string) => {
    const result = await fetchNewData(id)
    if (result.error) throw new Error(result.error)
    return result.data
  },
}

// 2. Add query key
export const queryKeys = {
  // ... existing keys
  newData: (id: string) => ['newData', id] as const,
}

// 3. Add hook
export function useNewData(id: string | null) {
  return useQuery({
    queryKey: queryKeys.newData(id ?? ''),
    queryFn: () => fetchers.newData(id!),
    enabled: !!id,
  })
}

// 4. Add invalidation helper (in useInvalidateQueries)
invalidateNewData: (id: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.newData(id) })
},

// 5. (Optional) Add prefetch (in usePrefetch)
prefetchNewData: (id: string | null) => {
  if (!id) return
  queryClient.prefetchQuery({
    queryKey: queryKeys.newData(id),
    queryFn: () => fetchers.newData(id),
  })
},
```

### Adding a New Skeleton

Add to `src/components/ui/Skeleton.tsx`:

```tsx
export function NewPageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Match your page structure */}
        <Skeleton className="h-10 w-48 mb-8" />
        {/* ... */}
      </div>
    </div>
  )
}
```

Export from `src/components/ui/index.ts`.

### Adding a New Constant

1. Add to `src/lib/constants.ts`
2. Export from the module
3. Import where needed

### Modifying Types

1. Update `src/lib/types.ts`
2. Check all usages for type errors
3. Run `npm run build` to verify

---

## Pull Request Checklist

Before submitting a PR:

- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes (or warnings documented)
- [ ] New code follows existing patterns
- [ ] Complex logic has comments
- [ ] No `console.log` in production code (use `console.error` for errors)
- [ ] No hardcoded strings that should be constants
- [ ] No duplicate code that should be extracted
- [ ] Tested locally (dev server and build)

### PR Description Template

```markdown
## What

Brief description of changes.

## Why

Motivation for the change.

## How

Technical approach.

## Testing

How was this tested?

## Screenshots

(If UI changes)
```

---

*Keep this guide updated as patterns evolve.*

*Last updated: December 2024*

