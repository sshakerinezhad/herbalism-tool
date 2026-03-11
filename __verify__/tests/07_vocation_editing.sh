#!/bin/bash
# Task 7: Vocation editable in edit-character page
set -e

CHARS="src/lib/db/characters.ts"
EDIT="src/app/edit-character/page.tsx"

# CharacterUpdate must include vocation
grep -q "vocation" "$CHARS" || { echo "FAIL: CharacterUpdate missing vocation field"; exit 1; }

# Edit page must import VOCATIONS
grep -q "VOCATIONS" "$EDIT" || { echo "FAIL: edit-character missing VOCATIONS import"; exit 1; }

# Edit page must have a vocation select/dropdown
grep -q "vocation" "$EDIT" || { echo "FAIL: edit-character missing vocation field"; exit 1; }

echo "PASS: vocation editing added"
