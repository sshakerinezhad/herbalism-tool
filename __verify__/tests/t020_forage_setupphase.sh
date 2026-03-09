#!/bin/bash
# T020: src/components/forage/SetupPhase.tsx exists
set -e

FILE="src/components/forage/SetupPhase.tsx"

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

# Should be ~170 lines, allow 100-250
LINES=$(wc -l < "$FILE")
if [ "$LINES" -lt 100 ] || [ "$LINES" -gt 250 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~170)"
  exit 1
fi

echo "PASS: SetupPhase.tsx created ($LINES lines)"
