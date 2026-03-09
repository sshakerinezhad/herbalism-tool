#!/bin/bash
# T019: src/components/forage/BiomeCard.tsx exists
set -e

FILE="src/components/forage/BiomeCard.tsx"

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

# Should be a reasonable size (~50 lines, allow 20-100)
LINES=$(wc -l < "$FILE")
if [ "$LINES" -lt 20 ] || [ "$LINES" -gt 100 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~50)"
  exit 1
fi

echo "PASS: BiomeCard.tsx created ($LINES lines)"
