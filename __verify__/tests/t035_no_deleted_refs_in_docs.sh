#!/bin/bash
# T035: Final documentation sweep — no stale references to deleted code patterns
set -e

FAIL=0

# CLAUDE.md should not have gotcha #7
if grep -q "Legacy tables deprecated" CLAUDE.md 2>/dev/null; then
  echo "FAIL: CLAUDE.md still has 'Legacy tables deprecated' gotcha"
  FAIL=1
fi

# Docs should not reference "element pools" (deleted from brewing.ts)
for DOC in docs/QUICKREF.md docs/ARCHITECTURE.md; do
  if grep -q "element pools" "$DOC" 2>/dev/null; then
    echo "FAIL: $DOC still references 'element pools'"
    FAIL=1
  fi
done

# QUICKREF.md should not have legacy tables gotcha
if grep -q "Legacy tables.*deprecated" docs/QUICKREF.md 2>/dev/null; then
  echo "FAIL: docs/QUICKREF.md still has legacy tables reference"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: No stale references in documentation"
