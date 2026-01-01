# CLAUDE.md

D&D homebrew companion app for herbalism/alchemy - forage herbs, manage inventory, brew elixirs/bombs/oils.

## Golden Rules
- all code should be industry standard and scalable
- no spaghetti code should be present and the codebase should be written in the cleanest and simplest way possible
- before adding new features or changing existing ones, consider how these changes will interact with the existing system. If it will introduce inefficiencies, scalability issues, or bloat, reassess.
- before implementing a plan consider if it makes sense. if it doesnt, or if you need additional clarification consider alternatives or ask for clarification.

## Tech Stack

- Next.js 16 (App Router, all client components with `'use client'`)
- Supabase (PostgreSQL + Auth)
- React Query (@tanstack/react-query) for data fetching
- Tailwind CSS v4

## Critical Gotchas

1. **Field name mismatch:** `brewingModifier` in app code maps to `herbalism_modifier` in database
2. **RLS status:** ON for all character tables including herbalism (`character_herbs`, `character_brewed`, `character_recipes`)
3. **Type casting:** Use `as unknown as Type` for Supabase join results
4. **Auth required:** No guest mode - pages redirect to `/login` if not authenticated
5. **Data fetching:** Always use React Query hooks from `@/lib/hooks`, not direct Supabase calls in components
6. **Herbalism is character-based:** All herbalism data (herbs, brewed items, recipes) is tied to `character_id`, not `user_id`. Forage/Brew pages require a character to exist.
7. **Legacy tables deprecated:** `user_inventory`, `user_brewed`, `user_recipes` still exist but are no longer used. Use `character_herbs`, `character_brewed`, `character_recipes` instead.

## Key Patterns

- All data hooks in `src/lib/hooks/queries.ts`
- Error return pattern: `{ data?, error: string | null }`
- Barrel exports from component folders (`index.ts`)
- Skeleton loading states for every page

## Documentation
- `scratchpad.md` - contains running context on the current task. read and update it as you work on a particular task (especially when passing off or resuming a task to/from another agent)

See these files for detailed guidance:
- `docs/QUICKREF.md` - One-page cheat sheet with imports and patterns
- `docs/CONTRIBUTING.md` - Code style and common tasks
- `docs/ARCHITECTURE.md` - Deep dive into system design
- `README.md` - Full project overview


## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build  
npm run db:types     # Generate TypeScript types from Supabase
npm run db:push      # Push migrations to remote
```

