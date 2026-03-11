# Handoff

Capture current session context for the next session while preserving the context currently in `.claude/scratchpad.md`

## Instructions

1. Read the current scratchpad at `.claude/scratchpad.md`
2. Summarize the current session's context:
   - What was worked on (in addition to whatever is already in `.claude/scratchpad.md` merged together)
   - Current state/progress
   - Any blockers or pending items
   - Key decisions made
   - Next steps
3. Merge the new context into `.claude/scratchpad.md` without harming or removing any context currently in it. You can merge and trim things to keep it tight but you should NOT delete context already in there.
5. Write the updated scratchpad

Keep the scratchpad concise but complete enough for a fresh session to pick up where this one left off.
