# CLAUDE.md - agent-amogus

Everything should be clean, simple, and scalable. No spaghetti code.

## Golden Rules
- Never assume. Read the code, don't guess.
- Simplest solution wins. If it's a bandaid, re-evaluate.
- The first solution is rarely the best, be critical and compare every option shrewdly
- Challenge your own biases, think several layers of abstraction deep
- The WHY matters as much as the WHAT. Include reasoning in decisions and documentation.
- Before implementing a plan, critique it. Does it make sense? What could go wrong? What does it interact with?
- My words are NOT gospel. They are a starting point. Push back.

## Verification

Verification with `/verify` is **optional** — only run it when I explicitly ask for it.

When I do request it:
- Run `/verify` against the workplan to generate tests in `__verify__/`
- After each change, run its corresponding test. If it fails, fix the implementation, not the test.
- At each breakpoint, run the checkpoint script. Fix before proceeding.

When I don't request it, `npm run build` is sufficient proof that things work.

## File Conventions
- `masterplan.md` — long-range architecture and goals
- `workplan.md` — current implementation steps
- `scratchpad.md` — context for session handoffs
- `notes.md` — raw backlog (bugs, issues, features)
- `__verify__/` — generated test scripts (do not modify)
- `changelog/` — archived masterplans

## Planning Protocol

I'm an engineer (physics/robotics) but not a software developer. I understand systems thinking — explain software-specific patterns and conventions, not basic logic.

Explain things simply, avoid jargon and provide simple examples to illustrate complex ideas.

Reasoning Context
When updating plans be sure to include what was done and why in *just* enough detail that context is preserved for the next agent.

Two-Pass Thinking
When making decision critique your own work. Does this make sense? What could go wrong?

4. Do not start implementation until I explicitly confirm

When things break: after fixing, briefly explain why it happened and what I should know to catch it earlier.

## Tech Stack

- Next.js 16 (App Router, all client components with `'use client'`)
- Supabase (PostgreSQL + Auth)
- React Query (@tanstack/react-query) for data fetching
- Tailwind CSS v4

## Critical Gotchas

1. **Field name mismatch:** `brewingModifier` in app code maps to `herbalism_modifier` in database
2. **RLS status:** ON for all character tables including herbalism (`character_herbs`, `character_brewed`, `character_recipes`)
3. **Type casting:** For Supabase joins, keep explicit type annotations (e.g., `(cr: CharacterRecipe) =>`) to catch property errors at build time. Use `as Type` when necessary, but avoid `as unknown as Type` which bypasses all type checking and hides bugs.
4. **Auth required:** No guest mode - pages redirect to `/login` if not authenticated
5. **Data fetching:** Always use React Query hooks from `@/lib/hooks`, not direct Supabase calls in components
6. **Herbalism is character-based:** All herbalism data (herbs, brewed items, recipes) is tied to `character_id`, not `user_id`. Forage/Brew pages require a character to exist.
7. **React keys on mapped arrays:** Never use `item.id` as key if the same item can appear multiple times. Either deduplicate the array or use index-based keys with stable data.
8. **Supabase is linked locally:** `npx supabase db push` and `npm run db:types` both work. Always regenerate types after pushing migrations (`npm run db:types`).

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


When committing code, follow these key points:
- Write concise, human-sounding commit messages (under 72 chars preferred)
- NO "Co-Authored-By" tags or AI attribution
- NO emojis unless the repo conventionally uses them
- Describe what changed and briefly why


## Context Management

**40%+ context saturation is high — start conserving.** Prefer referencing earlier reads over re-reading files. `offset`/`limit` is only allowed on files already read in full (partial reads without full context lead to bad edits).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build  
npm run db:types     # Generate TypeScript types from Supabase
npm run db:push      # Push migrations to remote
```

