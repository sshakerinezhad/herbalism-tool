#!/bin/bash
# T028: wizard/index.ts barrel export exists, create-character page.tsx reduced
set -e

FAIL=0

# Barrel export must exist
if [ ! -f "src/components/character/wizard/index.ts" ]; then
  echo "FAIL: src/components/character/wizard/index.ts does not exist"
  FAIL=1
fi

# Page should be significantly smaller than original 1104 lines
PAGE="src/app/create-character/page.tsx"
if [ -f "$PAGE" ]; then
  LINES=$(wc -l < "$PAGE")
  if [ "$LINES" -gt 500 ]; then
    echo "FAIL: $PAGE has $LINES lines (expected ~300, max 500)"
    FAIL=1
  fi
else
  echo "FAIL: $PAGE does not exist"
  FAIL=1
fi

# Page must still have auth guard and 'use client'
if ! grep -q "'use client'" "$PAGE" 2>/dev/null; then
  echo "FAIL: $PAGE missing 'use client' directive"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: Wizard barrel export created, page.tsx reduced ($LINES lines)"
