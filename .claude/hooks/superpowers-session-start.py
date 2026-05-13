#!/usr/bin/env python3
"""SessionStart hook: inject using-superpowers skill content as session context.

Replicates the behavior of obra/superpowers' upstream hook minus the
cross-harness branching — we only target Claude Code here.
"""
import json
from pathlib import Path

skill_path = Path(__file__).resolve().parent.parent / "skills" / "using-superpowers" / "SKILL.md"
skill = skill_path.read_text(encoding="utf-8")

context = (
    "<EXTREMELY_IMPORTANT>\n"
    "You have superpowers.\n\n"
    "**Below is the full content of your 'using-superpowers' skill — "
    "your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n"
    f"{skill}\n"
    "</EXTREMELY_IMPORTANT>"
)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": context,
    }
}))
