# Knights of Belyar Companion Constitution

## Core Principles

### I. Simplicity & Scalability
Code MUST be simple and scalable. Prefer the minimum complexity
needed for the current task. No premature abstractions, no
speculative features, no over-engineering. Three similar lines
of code is better than a premature helper. Every addition MUST
be evaluated for interaction with existing systems — if it
introduces inefficiency, bloat, or scaling issues, reassess
before proceeding.

### II. Character-Centric Data Model
All game data MUST be keyed on `character_id`, not `user_id`.
This enables future multi-character support and keeps the data
model consistent. Herbalism tables (`character_herbs`,
`character_brewed`, `character_recipes`) follow this pattern.
Legacy `user_*` tables are deprecated and MUST NOT be used.

### III. React Query Data Layer
All data fetching MUST go through React Query hooks in
`src/lib/hooks/`. Components MUST NOT call `src/lib/db/`
directly. This ensures consistent caching, deduplication, and
invalidation. The established pattern is: query keys + fetchers
+ `useXxx` hooks + invalidation helpers + optional prefetch
helpers, all centralized in `queries.ts`.

### IV. Client-Side Rendering
All pages use `'use client'`. No server-side rendering. This is
intentional: the app needs real-time state updates, works with
the Supabase client SDK, has no SEO requirements, and benefits
from a single mental model with no server/client boundary
confusion. Trade-off accepted: slightly slower initial load.

### V. Vocation-Ready Architecture
The codebase MUST support expansion beyond Herbalism to other
vocations (Blacksmith, Alchemist, Priest, etc.) without
requiring rewrites of shared systems. Character, auth, profile,
inventory, and UI infrastructure are shared; vocation-specific
logic lives in dedicated modules. New vocations SHOULD follow
the same patterns established by Herbalism.

## Technology Stack & Constraints

- **Framework:** Next.js 16 (App Router, client components only)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Data fetching:** React Query (@tanstack/react-query)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript strict mode, no `any`
- **Auth:** Required — no guest mode, redirect to `/login`
- **RLS:** ON for all character tables
- **Type safety:** Explicit type annotations for Supabase joins;
  `as Type` permitted, `as unknown as Type` prohibited
- **Error pattern:** All DB operations return `{ data?, error: string | null }`
- **Components:** PascalCase files, barrel exports via `index.ts`
- **Loading:** Skeleton states for every page

## Development Workflow

- **Data hooks:** Add to `src/lib/hooks/queries.ts` (fetcher +
  key + hook + invalidation + optional prefetch)
- **DB operations:** Add to `src/lib/db/characters.ts` or
  `characterInventory.ts`, follow `{ data?, error }` pattern
- **Components:** Create in `src/components/{feature}/`, export
  from folder `index.ts`
- **Pages:** `src/app/{route}/page.tsx`, `'use client'`, wrap
  in `<PageLayout>`, use React Query hooks, add skeleton
- **Import order:** React/Next > internal hooks > components >
  types > constants
- **Naming:** PascalCase components, camelCase functions,
  SCREAMING_SNAKE constants, kebab-case folders
- **Build verification:** `npm run build` and `npm run lint`
  MUST pass before merge
- **Commits:** Concise, human-sounding messages under 72 chars,
  no AI attribution, no emojis

## Governance

This constitution defines the non-negotiable standards for the
Knights of Belyar Companion codebase. All feature specs, plans,
and implementations MUST comply with these principles.

**Amendment process:**
1. Propose change with rationale (the WHY matters)
2. Evaluate impact on existing systems (two-pass thinking)
3. Document the amendment with version bump
4. Update dependent artifacts (specs, plans, tasks)

**Versioning:** MAJOR.MINOR.PATCH
- MAJOR: Principle removal or backward-incompatible redefinition
- MINOR: New principle or materially expanded guidance
- PATCH: Clarifications, wording, non-semantic refinements

**Compliance:** All work products (specs, plans, code) are
evaluated against this constitution. The constitution supersedes
ad-hoc decisions when conflicts arise.

**Version**: 1.0.0 | **Ratified**: 2026-03-08 | **Last Amended**: 2026-03-08
