# Command: Plan From Session Context (write to scratchpad.md)

You are to take the full context of the prior session and formulate a detailed, in-depth plan for another agent to execute. The plan must emphasize passing rich context along, including reasoning, file references, and motivations behind each fix. The output must be written to `.claude/scratchpad.md`.

## Pre-check (required)
- Read the current contents of `.claude/scratchpad.md`.
- Determine whether it is related to the plan you are about to write (e.g., same refactor/cleanup effort or earlier versions of the same tasks).
  - If related: incorporate what is already there (completed steps, pending fixes, extra context) and avoid losing relevant details.
  - If unrelated: overwrite it.

## Requirements
- Use the prior session context plus any related notes already in `.claude/scratchpad.md`.
- Provide a structured plan ordered by priority and rationale (user impact, risk, leverage, cost).
- Include specific file paths and why each is relevant (e.g., `src/app/inventory/page.tsx`, `src/app/brew/page.tsx`, `src/app/forage/page.tsx`, `src/lib/hooks/queries.ts`, `src/lib/db/*`, `src/lib/profile.tsx`).
- Call out non-refactor fixes identified earlier (auth flicker, missing error surfacing, non-atomic inventory mutations, shared search state, unused destructures).
- Keep the focus on translating context into actionable steps rather than re-litigating the analysis.
- Avoid rewriting history; add a concise context summary and then the plan.

## Output
- Write the final plan to `.claude/scratchpad.md` (either merged with related content or overwritten if unrelated).
- Make it readable for handoff: clear headings, crisp bullet points, and explicit next actions.
