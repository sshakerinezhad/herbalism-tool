# Contributing Guide

Coding standards and patterns for the herbalism-tool codebase.

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cliiijgqzwkiknukfgqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Commands
```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Lint check
npm run db:types  # Generate TypeScript types from Supabase
npm run db:push   # Push migrations to remote
```

---

## Code Style

### TypeScript
- Strict mode enabled
- No `any` — use proper types or `unknown`
- Prefer `interface` for objects
- Explicit return types for exported functions

### Import Order
```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Internal hooks
import { useCharacterHerbs, useInvalidateQueries } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'

// 3. Internal components
import { PageLayout } from '@/components/ui'
import { ElementBadge } from '@/components/elements'

// 4. Types
import type { Herb, CharacterHerb } from '@/lib/types'

// 5. Constants
import { ELEMENT_SYMBOLS, FORAGING_DC } from '@/lib/constants'
```

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HerbSelector`, `ElementBadge` |
| Functions | camelCase | `getCharacterHerbs`, `rollDice` |
| Constants | SCREAMING_SNAKE | `FORAGING_DC`, `ELEMENT_SYMBOLS` |
| Types/Interfaces | PascalCase | `CharacterHerb`, `BrewResult` |
| Files | PascalCase (components), kebab-case (other) | `ElementBadge.tsx`, `constants.ts` |
| Folders | kebab-case | `components/ui`, `components/brew` |

---

## File Organization

### Components
```
src/components/
├── brew/              # Brewing flow components
├── character/         # Character sheet components
├── elements/          # Element display (ElementBadge)
├── inventory/         # Inventory display
│   ├── equipment/     # Weapons & items tabs
│   ├── herbalism/     # Herbs & brewed tabs
│   └── modals/        # Add weapon/item modals
├── recipes/           # Recipe book
├── ui/                # Generic reusable (PageLayout, Skeleton, ErrorDisplay, etc.)
├── ArmorDiagram.tsx   # Armor visualization
└── PrefetchLink.tsx   # Smart link with hover prefetch
```

### Library Code
```
src/lib/
├── hooks/
│   ├── queries.ts        # All React Query hooks, prefetch, invalidation
│   ├── useBrewState.ts   # Brewing state machine
│   └── index.ts
├── db/
│   ├── characters.ts        # Character CRUD + equipment operations
│   ├── characterInventory.ts # Herb/brewed/recipe operations
│   ├── biomes.ts            # Biome data operations
│   └── index.ts
├── auth.tsx           # AuthContext + AuthProvider
├── profile.tsx        # ProfileContext + ProfileProvider
├── supabase.ts        # Database client
├── types.ts           # All type definitions
├── constants.ts       # Game constants
├── brewing.ts         # Brewing logic
├── dice.ts            # Dice utilities
└── database.types.ts  # Auto-generated Supabase types
```

### Pages
```
src/app/
├── page.tsx                    # Home (/)
├── login/page.tsx              # Auth (/login)
├── profile/page.tsx            # Character profile (/profile)
├── create-character/page.tsx   # Character creation wizard
├── edit-character/page.tsx     # Character editing
├── forage/page.tsx             # Foraging (/forage)
├── inventory/page.tsx          # Inventory (/inventory)
├── brew/page.tsx               # Brewing (/brew)
└── recipes/page.tsx            # Recipe book (/recipes)
```

---

## Database Operations

**Important:** All herbalism data is character-based. Use `character_herbs`, `character_brewed`, `character_recipes` — not the deprecated `user_*` tables.

### Return Pattern

All DB operations return `{ data?, error: string | null }`:

```typescript
export async function getCharacterHerbs(characterId: string): Promise<{
  items?: CharacterHerb[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_herbs')
    .select('*, herbs(*)')
    .eq('character_id', characterId)

  if (error) {
    console.error('getCharacterHerbs failed:', error)
    return { error: 'Failed to load herbs' }
  }

  return { items: data.map(row => ({ ... })), error: null }
}
```

### Type Casting

For Supabase joins, use explicit type annotations to catch errors at build time. Use `as Type` when necessary, but avoid `as unknown as Type` which bypasses all type checking.

---

## State Management

| Data Type | Where |
|-----------|-------|
| Server data (inventory, recipes, etc.) | React Query hooks (`@/lib/hooks`) |
| User auth state | AuthContext |
| User profile/settings | ProfileContext |
| Form inputs, UI state | Local `useState` |
| Brewing flow state | `useBrewState` hook |

---

## Common Tasks

### Adding a New React Query Hook

In `src/lib/hooks/queries.ts`:
1. Add fetcher to `fetchers` object
2. Add key to `queryKeys`
3. Create `useXxx` hook with `enabled` guard
4. Add invalidation helper in `useInvalidateQueries`
5. (Optional) Add prefetch helper in `usePrefetch`

### Adding a New Component

1. Create in `src/components/{feature}/ComponentName.tsx`
2. Export from folder's `index.ts`
3. Use barrel import: `import { Foo } from '@/components/feature'`

### Adding a New DB Operation

1. Add function in `src/lib/db/characters.ts` or `characterInventory.ts`
2. Follow `{ data?, error }` return pattern
3. Log errors to console, return user-friendly messages

### Adding a New Page

1. Create `src/app/{route}/page.tsx`
2. Add `'use client'` directive
3. Wrap in `<PageLayout>`
4. Use React Query hooks for data
5. Add skeleton loading state

---

## Pull Request Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Follows existing patterns
- [ ] No `console.log` in production code (use `console.error`)
- [ ] No hardcoded strings that should be constants

---

*Last updated: March 2026*
